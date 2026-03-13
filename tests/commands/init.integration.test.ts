import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = {
  prompts: {
    select: vi.fn(),
    confirm: vi.fn(),
    checkbox: vi.fn()
  },
  gitignore: {
    ensureGitignoreEntries: vi.fn()
  },
  store: {
    readConfig: vi.fn(),
    writeConfig: vi.fn()
  },
  flows: {
    runAuthenticationFlow: vi.fn(),
    chooseUseCase: vi.fn(),
    chooseCurrencies: vi.fn(),
    chooseCheckoutType: vi.fn(),
    setupWebhookPrompt: vi.fn(),
    setupPortalPrompt: vi.fn(),
    setupTaxPrompt: vi.fn(),
    collectProducts: vi.fn(),
    confirmSetupSummary: vi.fn()
  },
  generators: {
    writePublicConfigFile: vi.fn(),
    renderEnv: vi.fn(),
    writeEnvFile: vi.fn(),
    generateExpressSnippet: vi.fn(),
    generateNextAppSnippet: vi.fn(),
    generateNextPagesSnippet: vi.fn(),
    generateReactSnippet: vi.fn(),
    generateVanillaSnippet: vi.fn(),
    generateRawSnippet: vi.fn()
  },
  stripe: {
    createStripeClient: vi.fn(),
    createProductWithPrices: vi.fn(),
    createWebhookEndpoint: vi.fn(),
    createOrUpdatePortalConfig: vi.fn(),
    configureTaxSettings: vi.fn(),
    createPaymentLinks: vi.fn()
  },
  ui: {
    showBanner: vi.fn(),
    success: vi.fn(),
    warn: vi.fn(),
    withSpinner: vi.fn()
  },
  utils: {
    toUserFacingError: vi.fn(),
    fingerprintConfigProduct: vi.fn(),
    fingerprintProductInput: vi.fn()
  }
};

vi.mock('@inquirer/prompts', () => ({
  select: mocks.prompts.select,
  confirm: mocks.prompts.confirm,
  checkbox: mocks.prompts.checkbox
}));

vi.mock('../../src/config/gitignore.js', () => ({
  ensureGitignoreEntries: mocks.gitignore.ensureGitignoreEntries
}));

vi.mock('../../src/config/store.js', () => ({
  readConfig: mocks.store.readConfig,
  writeConfig: mocks.store.writeConfig
}));

vi.mock('../../src/flows/authentication.js', () => ({
  runAuthenticationFlow: mocks.flows.runAuthenticationFlow
}));

vi.mock('../../src/flows/checkout-setup.js', () => ({
  chooseCheckoutType: mocks.flows.chooseCheckoutType
}));

vi.mock('../../src/flows/portal-setup.js', () => ({
  setupPortalPrompt: mocks.flows.setupPortalPrompt
}));

vi.mock('../../src/flows/product-setup.js', () => ({
  chooseUseCase: mocks.flows.chooseUseCase,
  chooseCurrencies: mocks.flows.chooseCurrencies,
  collectProducts: mocks.flows.collectProducts
}));

vi.mock('../../src/flows/summary.js', () => ({
  confirmSetupSummary: mocks.flows.confirmSetupSummary
}));

vi.mock('../../src/flows/tax-setup.js', () => ({
  setupTaxPrompt: mocks.flows.setupTaxPrompt
}));

vi.mock('../../src/flows/webhook-setup.js', () => ({
  setupWebhookPrompt: mocks.flows.setupWebhookPrompt
}));

vi.mock('../../src/generators/config-json.js', () => ({
  writePublicConfigFile: mocks.generators.writePublicConfigFile
}));

vi.mock('../../src/generators/env.js', () => ({
  renderEnv: mocks.generators.renderEnv,
  writeEnvFile: mocks.generators.writeEnvFile
}));

vi.mock('../../src/generators/express.js', () => ({
  generateExpressSnippet: mocks.generators.generateExpressSnippet
}));

vi.mock('../../src/generators/nextjs-app.js', () => ({
  generateNextAppSnippet: mocks.generators.generateNextAppSnippet
}));

vi.mock('../../src/generators/nextjs-pages.js', () => ({
  generateNextPagesSnippet: mocks.generators.generateNextPagesSnippet
}));

vi.mock('../../src/generators/react.js', () => ({
  generateReactSnippet: mocks.generators.generateReactSnippet
}));

vi.mock('../../src/generators/vanilla.js', () => ({
  generateVanillaSnippet: mocks.generators.generateVanillaSnippet
}));

vi.mock('../../src/generators/raw.js', () => ({
  generateRawSnippet: mocks.generators.generateRawSnippet
}));

vi.mock('../../src/stripe/client.js', () => ({
  createStripeClient: mocks.stripe.createStripeClient
}));

vi.mock('../../src/stripe/products.js', () => ({
  createProductWithPrices: mocks.stripe.createProductWithPrices
}));

vi.mock('../../src/stripe/webhooks.js', () => ({
  createWebhookEndpoint: mocks.stripe.createWebhookEndpoint
}));

vi.mock('../../src/stripe/portal.js', () => ({
  createOrUpdatePortalConfig: mocks.stripe.createOrUpdatePortalConfig
}));

vi.mock('../../src/stripe/tax.js', () => ({
  configureTaxSettings: mocks.stripe.configureTaxSettings
}));

vi.mock('../../src/stripe/payment-links.js', () => ({
  createPaymentLinks: mocks.stripe.createPaymentLinks
}));

vi.mock('../../src/ui/display.js', () => ({
  showBanner: mocks.ui.showBanner,
  success: mocks.ui.success,
  warn: mocks.ui.warn
}));

vi.mock('../../src/ui/spinner.js', () => ({
  withSpinner: mocks.ui.withSpinner
}));

vi.mock('../../src/utils/errors.js', () => ({
  toUserFacingError: mocks.utils.toUserFacingError
}));

vi.mock('../../src/utils/fingerprint.js', () => ({
  fingerprintConfigProduct: mocks.utils.fingerprintConfigProduct,
  fingerprintProductInput: mocks.utils.fingerprintProductInput
}));

function setupDefaultMocks() {
  mocks.gitignore.ensureGitignoreEntries.mockResolvedValue({ exists: true });
  mocks.store.readConfig.mockResolvedValue(null);
  mocks.ui.showBanner.mockResolvedValue(undefined);

  mocks.flows.runAuthenticationFlow.mockResolvedValue({
    accountId: 'acct_test_123',
    mode: 'test',
    secretKey: 'sk_test_123',
    method: 'manual',
    keyHint: 'sk_test...123',
    publishableKey: 'pk_test_123'
  });
  mocks.flows.chooseUseCase.mockResolvedValue('digital_products');
  mocks.flows.chooseCurrencies.mockResolvedValue(['usd']);
  mocks.flows.chooseCheckoutType.mockResolvedValue('hosted');
  mocks.flows.setupWebhookPrompt.mockResolvedValue({ enabled: false });
  mocks.flows.setupPortalPrompt.mockResolvedValue({ enabled: false });
  mocks.flows.setupTaxPrompt.mockResolvedValue({ enabled: false });
  mocks.flows.collectProducts.mockResolvedValue([]);
  mocks.flows.confirmSetupSummary.mockResolvedValue(true);

  mocks.prompts.checkbox.mockResolvedValue([]);
  mocks.prompts.select.mockResolvedValue('update');

  mocks.ui.withSpinner.mockImplementation(async (_label: string, task: () => Promise<unknown>) => task());
  mocks.stripe.createStripeClient.mockReturnValue({});
  mocks.stripe.createProductWithPrices.mockResolvedValue({
    name: 'Pro Plan',
    description: 'Pro',
    stripeProductId: 'prod_pro',
    type: 'subscription',
    prices: [
      {
        amount: 1200,
        currency: 'usd',
        interval: 'month',
        stripePriceId: 'price_pro_month'
      }
    ]
  });

  mocks.utils.fingerprintConfigProduct.mockImplementation((product: { name: string }) => `fp:${product.name}`);
  mocks.utils.fingerprintProductInput.mockImplementation((input: { name: string }) => `fp:${input.name}`);
  mocks.utils.toUserFacingError.mockImplementation((error: { message?: string }) => ({
    message: error?.message ?? 'unknown',
    fix: 'retry'
  }));
}

describe('initCommand integration (composed mocks)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    setupDefaultMocks();
  });

  it('reuses existing setup and exits before any setup flow', async () => {
    mocks.store.readConfig.mockResolvedValue({ products: [] });
    mocks.prompts.select.mockResolvedValue('reuse');

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    expect(mocks.flows.runAuthenticationFlow).not.toHaveBeenCalled();
    expect(mocks.store.writeConfig).not.toHaveBeenCalled();
    expect(mocks.ui.success).toHaveBeenCalledWith(
      'Reusing existing setup. Use `stripe-ez status`, `stripe-ez add-product`, or run `stripe-ez` again to reconfigure.'
    );
  });

  it('updates existing setup by creating only non-duplicate products and merging config', async () => {
    const existingConfig = {
      version: '1.0.0',
      accountId: 'acct_existing',
      mode: 'test',
      createdAt: '2026-01-01T00:00:00.000Z',
      auth: {
        method: 'manual',
        keyHint: 'sk_test...old',
        publishableKey: 'pk_test_old'
      },
      products: [
        {
          name: 'Starter',
          type: 'subscription',
          stripeProductId: 'prod_starter',
          prices: [
            {
              amount: 500,
              currency: 'usd',
              interval: 'month',
              stripePriceId: 'price_starter_month',
              envVarName: 'STARTER_USD_MONTH_PRICE_ID'
            }
          ]
        }
      ],
      checkout: { type: 'hosted' }
    };

    mocks.store.readConfig.mockResolvedValue(existingConfig);
    mocks.prompts.select.mockResolvedValue('update');
    mocks.flows.collectProducts.mockResolvedValue([
      {
        name: 'Starter',
        type: 'subscription',
        prices: [{ amount: 500, currency: 'usd', interval: 'month' }]
      },
      {
        name: 'Pro Plan',
        type: 'subscription',
        prices: [{ amount: 1200, currency: 'usd', interval: 'month' }]
      }
    ]);
    mocks.flows.confirmSetupSummary.mockResolvedValue(true);

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    expect(mocks.stripe.createProductWithPrices).toHaveBeenCalledTimes(1);
    expect(mocks.stripe.createProductWithPrices).toHaveBeenCalledWith(expect.anything(), {
      name: 'Pro Plan',
      type: 'subscription',
      prices: [{ amount: 1200, currency: 'usd', interval: 'month' }]
    });

    expect(mocks.store.writeConfig).toHaveBeenCalledTimes(1);
    const writtenConfig = mocks.store.writeConfig.mock.calls[0][0];
    expect(writtenConfig.products).toHaveLength(2);
    expect(writtenConfig.products[0].name).toBe('Starter');
    expect(writtenConfig.products[1].name).toBe('Pro Plan');
    expect(writtenConfig.checkout.type).toBe('hosted');
    expect(writtenConfig.createdAt).toEqual(expect.any(String));

    expect(mocks.generators.writePublicConfigFile).toHaveBeenCalledTimes(1);
    expect(mocks.stripe.createPaymentLinks).not.toHaveBeenCalled();
  });

  it('cancels after summary confirmation and does not create Stripe resources or write files', async () => {
    mocks.flows.collectProducts.mockResolvedValue([
      {
        name: 'Starter',
        type: 'one_time',
        prices: [{ amount: 500, currency: 'usd' }]
      }
    ]);
    mocks.flows.confirmSetupSummary.mockResolvedValue(false);

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    expect(mocks.ui.warn).toHaveBeenCalledWith('Setup canceled. No Stripe resources were created.');
    expect(mocks.stripe.createStripeClient).not.toHaveBeenCalled();
    expect(mocks.stripe.createProductWithPrices).not.toHaveBeenCalled();
    expect(mocks.store.writeConfig).not.toHaveBeenCalled();
    expect(mocks.generators.writePublicConfigFile).not.toHaveBeenCalled();
  });

  it('warns when .gitignore is missing and exits early when update has no new products', async () => {
    const existingConfig = {
      version: '1.0.0',
      accountId: 'acct_existing',
      mode: 'test',
      createdAt: '2026-01-01T00:00:00.000Z',
      auth: {
        method: 'manual',
        keyHint: 'sk_test...old'
      },
      products: [
        {
          name: 'Starter',
          type: 'one_time',
          stripeProductId: 'prod_starter',
          prices: [{ amount: 500, currency: 'usd', stripePriceId: 'price_starter', envVarName: 'STARTER_PRICE_ID' }]
        }
      ],
      checkout: { type: 'hosted' }
    };

    mocks.gitignore.ensureGitignoreEntries.mockResolvedValue({ exists: false, added: [], missing: ['.env', '.stripe-ez.json'] });
    mocks.store.readConfig.mockResolvedValue(existingConfig);
    mocks.prompts.select.mockResolvedValue('update');
    mocks.flows.collectProducts.mockResolvedValue([
      {
        name: 'Starter',
        type: 'one_time',
        prices: [{ amount: 500, currency: 'usd' }]
      }
    ]);

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    expect(mocks.ui.warn).toHaveBeenCalledWith(
      'No .gitignore found. Create one and include .stripe-ez.json and .env to avoid committing secrets.'
    );
    expect(mocks.ui.warn).toHaveBeenCalledWith(
      'All provided products already exist in your local setup. Nothing new to create.'
    );
    expect(mocks.flows.confirmSetupSummary).not.toHaveBeenCalled();
    expect(mocks.stripe.createStripeClient).not.toHaveBeenCalled();
  });

  it('skips Stripe webhook creation for local webhook url and marks endpoint as local', async () => {
    mocks.store.readConfig.mockResolvedValue(null);
    mocks.flows.collectProducts.mockResolvedValue([
      {
        name: 'Starter',
        type: 'one_time',
        prices: [{ amount: 500, currency: 'usd' }]
      }
    ]);
    mocks.flows.confirmSetupSummary.mockResolvedValue(true);
    mocks.flows.setupWebhookPrompt.mockResolvedValue({
      enabled: true,
      url: 'http://localhost:3000/api/webhooks/stripe',
      events: ['checkout.session.completed']
    });

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    expect(mocks.stripe.createWebhookEndpoint).not.toHaveBeenCalled();
    expect(mocks.store.writeConfig).toHaveBeenCalledTimes(1);
    const writtenConfig = mocks.store.writeConfig.mock.calls[0][0];
    expect(writtenConfig.webhook.stripeEndpointId).toBe('local');
  });

  it('generates env, framework snippet, and payment links when selected', async () => {
    mocks.store.readConfig.mockResolvedValue(null);
    mocks.flows.chooseCheckoutType.mockResolvedValue('payment_links');
    mocks.flows.collectProducts.mockResolvedValue([
      {
        name: 'Starter',
        type: 'one_time',
        prices: [{ amount: 500, currency: 'usd' }]
      }
    ]);
    mocks.flows.confirmSetupSummary.mockResolvedValue(true);
    mocks.prompts.checkbox.mockResolvedValue(['env', 'code', 'links']);
    mocks.prompts.select.mockResolvedValueOnce('react');
    mocks.generators.renderEnv.mockReturnValue('STRIPE_SECRET_KEY=sk_test_123\n');
    mocks.generators.generateReactSnippet.mockReturnValue('// react snippet');
    mocks.stripe.createPaymentLinks.mockResolvedValue([{ priceId: 'price_pro_month', url: 'https://pay.test/link' }]);

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    expect(mocks.generators.renderEnv).toHaveBeenCalledTimes(1);
    expect(mocks.generators.writeEnvFile).toHaveBeenCalledWith('STRIPE_SECRET_KEY=sk_test_123\n');
    expect(mocks.generators.generateReactSnippet).toHaveBeenCalledTimes(1);
    expect(mocks.stripe.createPaymentLinks).toHaveBeenCalledTimes(1);
    expect(mocks.ui.warn).toHaveBeenCalledWith('You are in TEST mode. Add --live in the future when you are ready for production.');
  });

  it('updates an existing test setup to live mode and writes live env values when live auth credentials are returned', async () => {
    const existingConfig = {
      version: '1.0.0',
      accountId: 'acct_test_existing',
      mode: 'test',
      createdAt: '2026-01-01T00:00:00.000Z',
      auth: {
        method: 'stripe_cli',
        keyHint: 'sk_test...old',
        publishableKey: 'pk_test_old'
      },
      products: [
        {
          name: 'Starter',
          type: 'subscription',
          stripeProductId: 'prod_starter',
          prices: [
            {
              amount: 500,
              currency: 'usd',
              interval: 'month',
              stripePriceId: 'price_starter_month',
              envVarName: 'STARTER_USD_MONTH_PRICE_ID'
            }
          ]
        }
      ],
      checkout: { type: 'hosted' }
    };
    const liveSecret = ['sk', 'live', 'replacement123'].join('_');
    const livePublishable = ['pk', 'live', 'replacement123'].join('_');
    const renderedEnv = [
      `STRIPE_SECRET_KEY=${liveSecret}`,
      `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${livePublishable}`,
      ''
    ].join('\n');

    mocks.store.readConfig.mockResolvedValue(existingConfig);
    mocks.prompts.select.mockResolvedValue('update');
    mocks.prompts.checkbox.mockResolvedValue(['env']);
    mocks.flows.runAuthenticationFlow.mockResolvedValue({
      accountId: 'acct_live_456',
      mode: 'live',
      secretKey: liveSecret,
      method: 'stripe_cli',
      keyHint: 'sk_live...t123',
      publishableKey: livePublishable,
      stripeCliVersion: 'stripe version 1.24.0'
    });
    mocks.flows.collectProducts.mockResolvedValue([
      {
        name: 'Growth',
        type: 'subscription',
        prices: [{ amount: 1500, currency: 'usd', interval: 'month' }]
      }
    ]);
    mocks.stripe.createProductWithPrices.mockResolvedValue({
      name: 'Growth',
      description: 'Growth plan',
      stripeProductId: 'prod_growth',
      type: 'subscription',
      prices: [
        {
          amount: 1500,
          currency: 'usd',
          interval: 'month',
          stripePriceId: 'price_growth_month'
        }
      ]
    });
    mocks.generators.renderEnv.mockReturnValue(renderedEnv);

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    expect(mocks.generators.renderEnv).toHaveBeenCalledWith({
      config: expect.objectContaining({
        mode: 'live',
        accountId: 'acct_live_456',
        auth: expect.objectContaining({
          publishableKey: livePublishable,
          stripeCliVersion: 'stripe version 1.24.0'
        })
      }),
      secretKey: liveSecret,
      publishableKey: livePublishable,
      webhookSecret: undefined
    });
    expect(mocks.generators.writeEnvFile).toHaveBeenCalledWith(renderedEnv);

    const writtenConfig = mocks.store.writeConfig.mock.calls[0][0];
    expect(writtenConfig.mode).toBe('live');
    expect(writtenConfig.accountId).toBe('acct_live_456');
    expect(writtenConfig.auth.publishableKey).toBe(livePublishable);
    expect(mocks.ui.warn).not.toHaveBeenCalledWith(
      'You are in TEST mode. Add --live in the future when you are ready for production.'
    );
  });

  it('handles thrown errors via toUserFacingError', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.flows.runAuthenticationFlow.mockRejectedValue(new Error('boom'));
    mocks.utils.toUserFacingError.mockReturnValue({ message: 'Friendly error', fix: 'Do the thing' });

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    expect(mocks.utils.toUserFacingError).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith('\nFriendly error');
    expect(errorSpy).toHaveBeenCalledWith('Fix: Do the thing');
  });

  it('uses non-interval env var naming for one-time prices', async () => {
    mocks.store.readConfig.mockResolvedValue(null);
    mocks.flows.collectProducts.mockResolvedValue([
      { name: 'One Time', type: 'one_time', prices: [{ amount: 500, currency: 'usd' }] }
    ]);
    mocks.flows.confirmSetupSummary.mockResolvedValue(true);
    mocks.stripe.createProductWithPrices.mockResolvedValue({
      name: 'One Time',
      stripeProductId: 'prod_one',
      type: 'one_time',
      prices: [{ amount: 500, currency: 'usd', stripePriceId: 'price_one' }]
    });

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    const writtenConfig = mocks.store.writeConfig.mock.calls[0][0];
    expect(writtenConfig.products[0].prices[0].envVarName).toBe('ONE_TIME_USD_PRICE_ID');
  });

  it.each([
    ['https://preview.local/webhooks/stripe'],
    ['https://172.20.0.1/webhooks/stripe'],
    ['not-a-url']
  ])('treats webhook url as non-public and skips endpoint creation: %s', async (url) => {
    mocks.store.readConfig.mockResolvedValue(null);
    mocks.flows.collectProducts.mockResolvedValue([
      { name: 'Starter', type: 'one_time', prices: [{ amount: 500, currency: 'usd' }] }
    ]);
    mocks.flows.confirmSetupSummary.mockResolvedValue(true);
    mocks.flows.setupWebhookPrompt.mockResolvedValue({
      enabled: true,
      url,
      events: ['checkout.session.completed']
    });

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    expect(mocks.stripe.createWebhookEndpoint).not.toHaveBeenCalled();
    const writtenConfig = mocks.store.writeConfig.mock.calls[0][0];
    expect(writtenConfig.webhook.stripeEndpointId).toBe('local');
  });

  it('registers webhook endpoint for public url and stores signing hint', async () => {
    mocks.store.readConfig.mockResolvedValue(null);
    mocks.flows.collectProducts.mockResolvedValue([
      { name: 'Starter', type: 'one_time', prices: [{ amount: 500, currency: 'usd' }] }
    ]);
    mocks.flows.confirmSetupSummary.mockResolvedValue(true);
    mocks.flows.setupWebhookPrompt.mockResolvedValue({
      enabled: true,
      url: 'https://app.example.com/webhooks/stripe',
      events: ['checkout.session.completed']
    });
    mocks.stripe.createWebhookEndpoint.mockResolvedValue({
      endpointId: 'we_123',
      secret: 'whsec_123',
      secretHint: 'whsec_12...0123'
    });

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    expect(mocks.stripe.createWebhookEndpoint).toHaveBeenCalledTimes(1);
    const writtenConfig = mocks.store.writeConfig.mock.calls[0][0];
    expect(writtenConfig.webhook.stripeEndpointId).toBe('we_123');
    expect(writtenConfig.webhook.signingSecretHint).toBe('whsec_12...0123');
  });

  it.each([
    ['next_app', 'generateNextAppSnippet'],
    ['next_pages', 'generateNextPagesSnippet'],
    ['express', 'generateExpressSnippet'],
    ['vanilla', 'generateVanillaSnippet'],
    ['raw', 'generateRawSnippet']
  ])('uses framework generator for %s', async (framework, generatorName) => {
    mocks.store.readConfig.mockResolvedValue(null);
    mocks.flows.collectProducts.mockResolvedValue([
      { name: 'Starter', type: 'one_time', prices: [{ amount: 500, currency: 'usd' }] }
    ]);
    mocks.flows.confirmSetupSummary.mockResolvedValue(true);
    mocks.prompts.checkbox.mockResolvedValue(['code']);
    mocks.prompts.select.mockResolvedValue(framework);
    (mocks.generators as Record<string, ReturnType<typeof vi.fn>>)[generatorName].mockReturnValue(`// ${framework}`);

    const { initCommand } = await import('../../src/commands/init.js');
    await initCommand({ banner: false });

    expect((mocks.generators as Record<string, ReturnType<typeof vi.fn>>)[generatorName]).toHaveBeenCalledTimes(1);
  });
});