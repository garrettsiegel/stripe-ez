import { readConfig, writeConfig } from '../config/store.js';
import { collectProducts } from '../flows/product-setup.js';
import { createStripeClient } from '../stripe/client.js';
import { createProductWithPrices } from '../stripe/products.js';
import { fingerprintConfigProduct, fingerprintProductInput } from '../utils/fingerprint.js';

export async function addProductCommand(): Promise<void> {
  const config = await readConfig();
  if (!config) {
    console.log('No setup found. Run `stripe-ez init` first.');
    return;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.log('Set STRIPE_SECRET_KEY in your environment, then run add-product again.');
    return;
  }

  const stripe = createStripeClient(secretKey);
  const additions = await collectProducts('both', ['usd']);

  const existingFingerprints = new Set(config.products.map((product) => fingerprintConfigProduct(product)));
  const uniqueAdditions = additions.filter((product) => !existingFingerprints.has(fingerprintProductInput(product)));

  if (uniqueAdditions.length === 0) {
    console.log('All entered products already exist in your setup. Nothing new to create.');
    return;
  }

  for (const item of uniqueAdditions) {
    const created = await createProductWithPrices(stripe, item);
    config.products.push({
      name: created.name,
      description: created.description,
      stripeProductId: created.stripeProductId,
      type: created.type,
      trialDays: created.prices.find((price) => typeof price.trialDays === 'number')?.trialDays,
      prices: created.prices.map((price) => ({
        amount: price.amount,
        currency: price.currency,
        interval: price.interval,
        trialDays: price.trialDays,
        stripePriceId: price.stripePriceId,
        usageType: price.usageType,
        billingScheme: price.billingScheme,
        tiers: price.tiers,
        envVarName: `${created.name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}_PRICE_ID`
      }))
    });
  }

  await writeConfig(config);
  console.log('Added product(s) and updated .stripe-ez.json');
}
