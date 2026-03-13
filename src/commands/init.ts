import { checkbox, confirm, select } from '@inquirer/prompts';
import { ensureGitignoreEntries } from '../config/gitignore.js';
import { StripeEzConfig } from '../config/schema.js';
import { readConfig, writeConfig } from '../config/store.js';
import { runAuthenticationFlow } from '../flows/authentication.js';
import { chooseCheckoutType } from '../flows/checkout-setup.js';
import { setupPortalPrompt } from '../flows/portal-setup.js';
import { chooseCurrencies, chooseUseCase, collectProducts } from '../flows/product-setup.js';
import { confirmSetupSummary } from '../flows/summary.js';
import { setupTaxPrompt } from '../flows/tax-setup.js';
import { setupWebhookPrompt } from '../flows/webhook-setup.js';
import { writePublicConfigFile } from '../generators/config-json.js';
import { renderEnv, writeEnvFile } from '../generators/env.js';
import { generateExpressSnippet } from '../generators/express.js';
import { generateNextAppSnippet } from '../generators/nextjs-app.js';
import { generateNextPagesSnippet } from '../generators/nextjs-pages.js';
import { generateReactSnippet } from '../generators/react.js';
import { generateVanillaSnippet } from '../generators/vanilla.js';
import { generateRawSnippet } from '../generators/raw.js';
import { createStripeClient } from '../stripe/client.js';
import { createPaymentLinks } from '../stripe/payment-links.js';
import { createOrUpdatePortalConfig } from '../stripe/portal.js';
import { createProductWithPrices } from '../stripe/products.js';
import { configureTaxSettings } from '../stripe/tax.js';
import { createWebhookEndpoint } from '../stripe/webhooks.js';
import { showBanner, success, warn } from '../ui/display.js';
import { withSpinner } from '../ui/spinner.js';
import { toUserFacingError } from '../utils/errors.js';
import { fingerprintConfigProduct, fingerprintProductInput } from '../utils/fingerprint.js';

export async function initCommand(options?: { banner?: boolean }): Promise<void> {
  await showBanner({ enabled: options?.banner !== false });

  try {
    const gitignore = await ensureGitignoreEntries();
    if (!gitignore.exists) {
      warn('No .gitignore found. Create one and include .stripe-ez.json and .env to avoid committing secrets.');
    }

    const existing = await readConfig();
    let rerunAction: 'replace' | 'update' | 'reuse' = 'replace';
    if (existing) {
      rerunAction = await select({
        message: '\nI found an existing stripe-ez setup. What do you want to do?',
        choices: [
          { name: 'Update setup (recommended: keep existing + add new)', value: 'update' },
          { name: 'Replace setup (create fresh Stripe resources)', value: 'replace' },
          { name: 'Keep existing setup (skip Stripe changes)', value: 'reuse' }
        ],
        default: 'update'
      });

      if (rerunAction === 'reuse') {
        success('Reusing existing setup. Use `stripe-ez status`, `stripe-ez add-product`, or run `stripe-ez` again to reconfigure.');
        return;
      }
    }

    const auth = await runAuthenticationFlow();
    const useCase = await chooseUseCase();
    const currencies = await chooseCurrencies();
    const checkoutType = await chooseCheckoutType();
    const webhookPrompt = await setupWebhookPrompt();
    const portalPrompt = await setupPortalPrompt();
    const taxPrompt = await setupTaxPrompt();
    const productsInput = await collectProducts(useCase, currencies);

    const existingFingerprints = new Set(
      (existing?.products ?? []).map((product) => fingerprintConfigProduct(product))
    );

    const filteredInputs =
      rerunAction === 'update'
        ? productsInput.filter((candidate) => !existingFingerprints.has(fingerprintProductInput(candidate)))
        : productsInput;

    if (filteredInputs.length === 0) {
      warn('All provided products already exist in your local setup. Nothing new to create.');
      return;
    }

    const confirmed = await confirmSetupSummary({
      accountId: auth.accountId,
      mode: auth.mode,
      products: filteredInputs,
      checkoutType,
      webhook: webhookPrompt
    });

    if (!confirmed) {
      warn('Setup canceled. No Stripe resources were created.');
      return;
    }

    const stripe = createStripeClient(auth.secretKey);

    const createdProducts = await withSpinner('Creating products and prices...', async () => {
      const out = [];
      for (const productInput of filteredInputs) {
        const created = await createProductWithPrices(stripe, productInput);
        out.push(created);
      }
      return out;
    });

    let webhookResult: { endpointId: string; secret?: string; secretHint?: string } | undefined;
    if (webhookPrompt.enabled && webhookPrompt.url && webhookPrompt.events?.length) {
      if (!isPublicWebhookUrl(webhookPrompt.url)) {
        // Local URL — skip Stripe API registration, save config with events only
      } else {
        webhookResult = await withSpinner('Registering webhook endpoint...', async () =>
          createWebhookEndpoint(stripe, {
            url: webhookPrompt.url!,
            events: webhookPrompt.events!
          })
        );
      }
    }

    let portalResult: { configurationId: string; businessName: string; supportEmail?: string } | undefined;
    if (portalPrompt.enabled && portalPrompt.businessName) {
      portalResult = await withSpinner('Configuring customer portal...', async () =>
        createOrUpdatePortalConfig(stripe, {
          businessName: portalPrompt.businessName!,
          supportEmail: portalPrompt.supportEmail
        })
      );
    }

    let taxResult: { behavior: 'automatic' | 'required' | 'unset' } | undefined;
    if (taxPrompt.enabled && taxPrompt.behavior) {
      taxResult = await withSpinner('Saving tax preferences...', async () =>
        configureTaxSettings(stripe, {
          behavior: taxPrompt.behavior!
        })
      );
    }

    const newProducts: StripeEzConfig['products'] = createdProducts.map((product) => ({
      name: product.name,
      description: product.description,
      stripeProductId: product.stripeProductId,
      type: product.type,
      prices: product.prices.map((price) => ({
        amount: price.amount,
        currency: price.currency,
        interval: price.interval,
        trialDays: price.trialDays,
        stripePriceId: price.stripePriceId,
        usageType: price.usageType,
        billingScheme: price.billingScheme,
        tiers: price.tiers,
        envVarName: buildEnvVarName(product.name, price.interval, price.currency)
      })),
      trialDays: product.prices.find((price) => typeof price.trialDays === 'number')?.trialDays
    }));

    const config: StripeEzConfig = {
      version: '1.0.0',
      accountId: auth.accountId,
      mode: auth.mode,
      createdAt: new Date().toISOString(),
      auth: {
        method: auth.method,
        keyHint: auth.keyHint,
        publishableKey: auth.publishableKey,
        stripeCliVersion: auth.stripeCliVersion
      },
      products: rerunAction === 'update' && existing ? [...existing.products, ...newProducts] : newProducts,
      webhook:
        webhookPrompt.enabled && webhookPrompt.url && webhookPrompt.events
          ? {
              url: webhookPrompt.url,
              stripeEndpointId: webhookResult?.endpointId ?? 'local',
              events: webhookPrompt.events,
              signingSecretHint: webhookResult?.secretHint
            }
          : undefined,
      checkout: {
        type: checkoutType
      },
      portal: portalResult
        ? {
            configurationId: portalResult.configurationId,
            businessName: portalResult.businessName,
            supportEmail: portalResult.supportEmail
          }
        : undefined,
      tax: taxResult
        ? {
            behavior: taxResult.behavior
          }
        : undefined
    };

    await writeConfig(config);
    await writePublicConfigFile(config);

    success('\nDone! Your Stripe setup is ready.\n');
    success('Wrote stripe-config.json (safe to commit).');

    if (webhookPrompt.enabled && webhookPrompt.url && !isPublicWebhookUrl(webhookPrompt.url)) {
      console.log(`\nTo test webhooks locally, run:\n`);
      console.log(`  stripe listen --forward-to ${webhookPrompt.url}\n`);
    }

    const outputChoices = await checkbox({
      message: '\nWhat should I generate for you now?',
      choices: [
        { name: '.env file (recommended)', value: 'env', checked: true },
        { name: 'Code snippet for your framework (copy/paste ready)', value: 'code', checked: true },
        { name: 'Payment links (shareable URLs)', value: 'links', checked: checkoutType === 'payment_links' }
      ]
    });

    if (outputChoices.includes('env')) {
      const env = renderEnv({
        config,
        secretKey: auth.secretKey,
        publishableKey: auth.publishableKey,
        webhookSecret: webhookResult?.secret
      });
      await writeEnvFile(env);
      success('Wrote .env file.');
    }

    if (outputChoices.includes('code')) {
      const framework = await select({
        message: '\nWhich framework are you using?',
        choices: [
          { name: 'Next.js (App Router)', value: 'next_app' },
          { name: 'Next.js (Pages Router)', value: 'next_pages' },
          { name: 'Express / Node.js', value: 'express' },
          { name: 'React (client-side only)', value: 'react' },
          { name: 'Vanilla HTML/JS', value: 'vanilla' },
          { name: 'Other (just give me the raw API calls)', value: 'raw' }
        ]
      });

      const snippet =
        framework === 'next_app'
          ? generateNextAppSnippet(config)
          : framework === 'next_pages'
            ? generateNextPagesSnippet(config)
            : framework === 'express'
              ? generateExpressSnippet(config)
              : framework === 'react'
                ? generateReactSnippet(config)
                : framework === 'vanilla'
                  ? generateVanillaSnippet(config)
                  : generateRawSnippet(config);
      console.log('\n===== Generated snippet =====\n');
      console.log(snippet);
      console.log('=============================\n');
    }

    if (outputChoices.includes('links')) {
      const priceIds = config.products.flatMap((p) => p.prices.map((x) => x.stripePriceId));
      const links = await createPaymentLinks(stripe, priceIds);
      console.log('\nPayment Links:\n');
      links.forEach((link) => {
        console.log(`${link.priceId}: ${link.url}`);
      });
      console.log();
    }

    if (auth.mode === 'test') {
      warn('You are in TEST mode. Add --live in the future when you are ready for production.');
    }
  } catch (error) {
    const userError = toUserFacingError(error);
    console.error(`\n${userError.message}`);
    console.error(`Fix: ${userError.fix}`);
  }
}

function isPublicWebhookUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') return false;
    if (host.endsWith('.local')) return false;
    if (host.startsWith('10.') || host.startsWith('192.168.')) return false;

    const private172 = host.match(/^172\.(\d{1,3})\./);
    if (private172) {
      const secondOctet = Number(private172[1]);
      if (secondOctet >= 16 && secondOctet <= 31) return false;
    }

    return true;
  } catch {
    return false;
  }
}

function buildEnvVarName(productName: string, interval?: string, currency = 'usd'): string {
  const normalized = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const currencySuffix = currency.toUpperCase();

  if (interval) {
    return `${normalized}_${currencySuffix}_${interval.toUpperCase()}_PRICE_ID`;
  }

  return `${normalized}_${currencySuffix}_PRICE_ID`;
}
