import { beforeEach, describe, expect, it, vi } from 'vitest';

const readConfigMock = vi.fn();
const writeConfigMock = vi.fn();
const collectProductsMock = vi.fn();
const createStripeClientMock = vi.fn();
const createProductWithPricesMock = vi.fn();

vi.mock('../../src/config/store.js', () => ({
  readConfig: readConfigMock,
  writeConfig: writeConfigMock
}));

vi.mock('../../src/flows/product-setup.js', () => ({
  collectProducts: collectProductsMock
}));

vi.mock('../../src/stripe/client.js', () => ({
  createStripeClient: createStripeClientMock
}));

vi.mock('../../src/stripe/products.js', () => ({
  createProductWithPrices: createProductWithPricesMock
}));

describe('addProductCommand', () => {
  const originalEnv = process.env.STRIPE_SECRET_KEY;
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = originalEnv;
  });

  it('exits when no setup config exists', async () => {
    readConfigMock.mockResolvedValue(null);
    const { addProductCommand } = await import('../../src/commands/add-product.js');

    await addProductCommand();
    expect(consoleLogSpy).toHaveBeenCalledWith('No setup found. Run `stripe-ez init` first.');
    expect(collectProductsMock).not.toHaveBeenCalled();
  });

  it('exits when secret key is missing', async () => {
    readConfigMock.mockResolvedValue({ products: [] });
    delete process.env.STRIPE_SECRET_KEY;
    const { addProductCommand } = await import('../../src/commands/add-product.js');

    await addProductCommand();
    expect(consoleLogSpy).toHaveBeenCalledWith('Set STRIPE_SECRET_KEY in your environment, then run add-product again.');
    expect(collectProductsMock).not.toHaveBeenCalled();
  });

  it('skips when all additions are duplicates', async () => {
    const config = {
      products: [
        {
          name: 'Pro Plan',
          type: 'subscription',
          stripeProductId: 'prod_1',
          prices: [{ amount: 1000, currency: 'usd', interval: 'month', stripePriceId: 'price_1', envVarName: 'PRO_PRICE_ID' }]
        }
      ]
    };

    readConfigMock.mockResolvedValue(config);
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    collectProductsMock.mockResolvedValue([
      { name: 'Pro Plan', type: 'subscription', prices: [{ amount: 1000, currency: 'usd', interval: 'month' }] }
    ]);

    const { addProductCommand } = await import('../../src/commands/add-product.js');
    await addProductCommand();

    expect(createProductWithPricesMock).not.toHaveBeenCalled();
    expect(writeConfigMock).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('All entered products already exist in your setup. Nothing new to create.');
  });

  it('adds unique products and writes updated config', async () => {
    const config = { products: [] as any[] };
    const stripeMock = { accounts: {} };
    readConfigMock.mockResolvedValue(config);
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    createStripeClientMock.mockReturnValue(stripeMock);
    collectProductsMock.mockResolvedValue([
      { name: 'Starter', type: 'one_time', prices: [{ amount: 500, currency: 'usd' }] }
    ]);
    createProductWithPricesMock.mockResolvedValue({
      name: 'Starter',
      type: 'one_time',
      stripeProductId: 'prod_new',
      prices: [{ amount: 500, currency: 'usd', stripePriceId: 'price_new' }]
    });

    const { addProductCommand } = await import('../../src/commands/add-product.js');
    await addProductCommand();

    expect(createStripeClientMock).toHaveBeenCalledWith('sk_test_123');
    expect(createProductWithPricesMock).toHaveBeenCalledWith(stripeMock, {
      name: 'Starter',
      type: 'one_time',
      prices: [{ amount: 500, currency: 'usd' }]
    });
    expect(writeConfigMock).toHaveBeenCalledTimes(1);
    expect(config.products).toHaveLength(1);
    expect(config.products[0].envVarName).toBeUndefined();
    expect(config.products[0].prices[0].envVarName).toBe('STARTER_PRICE_ID');
  });
});
