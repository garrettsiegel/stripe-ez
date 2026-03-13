import { describe, expect, it, vi } from 'vitest';
import { createProductWithPrices, ProductCreateInput } from '../../src/stripe/products.js';

function makeStripeMock() {
  return {
    products: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn().mockResolvedValue({ id: 'prod_new' })
    },
    prices: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn().mockResolvedValue({ id: 'price_new' })
    }
  } as any;
}

describe('createProductWithPrices', () => {
  it('creates new product and prices when no fingerprint match exists', async () => {
    const stripe = makeStripeMock();
    const input: ProductCreateInput = {
      name: 'Pro Plan',
      type: 'subscription',
      prices: [{ amount: 1200, currency: 'usd', interval: 'month' }]
    };

    const out = await createProductWithPrices(stripe, input);

    expect(stripe.products.create).toHaveBeenCalledTimes(1);
    expect(stripe.prices.create).toHaveBeenCalledTimes(1);
    expect(out.stripeProductId).toBe('prod_new');
    expect(out.prices[0].stripePriceId).toBe('price_new');
  });

  it('reuses existing product and price when fingerprints match', async () => {
    const stripe = makeStripeMock();
    stripe.products.list.mockResolvedValue({
      data: [{ id: 'prod_existing', metadata: { stripeEzFingerprint: 'fp-product' } }]
    });
    stripe.prices.list.mockResolvedValue({
      data: [{ id: 'price_existing', metadata: { stripeEzPriceFingerprint: '1200:usd:month:none:licensed:per_unit:[]' } }]
    });

    const input: ProductCreateInput = {
      name: 'Pro Plan',
      type: 'subscription',
      prices: [{ amount: 1200, currency: 'usd', interval: 'month' }]
    };

    const { fingerprintProductInput } = await import('../../src/utils/fingerprint.js');
    const productFp = fingerprintProductInput(input);
    stripe.products.list.mockResolvedValue({ data: [{ id: 'prod_existing', metadata: { stripeEzFingerprint: productFp } }] });

    const out = await createProductWithPrices(stripe, input);
    expect(stripe.products.create).not.toHaveBeenCalled();
    expect(stripe.prices.create).not.toHaveBeenCalled();
    expect(out.stripeProductId).toBe('prod_existing');
    expect(out.prices[0].stripePriceId).toBe('price_existing');
  });

  it('creates tiered prices with graduated tiers payload', async () => {
    const stripe = makeStripeMock();
    const input: ProductCreateInput = {
      name: 'Usage Plan',
      type: 'subscription',
      prices: [
        {
          amount: 0,
          currency: 'usd',
          interval: 'month',
          usageType: 'metered',
          billingScheme: 'tiered',
          tiers: [{ upTo: 1000, unitAmount: 100 }, { unitAmount: 80 }]
        }
      ]
    };

    await createProductWithPrices(stripe, input);

    expect(stripe.prices.create).toHaveBeenCalledTimes(1);
    const [payload] = stripe.prices.create.mock.calls[0];
    expect(payload.billing_scheme).toBe('tiered');
    expect(payload.tiers_mode).toBe('graduated');
    expect(payload.tiers).toEqual([
      { up_to: 1000, flat_amount: undefined, unit_amount: 100 },
      { up_to: 'inf', flat_amount: undefined, unit_amount: 80 }
    ]);
    expect(payload.unit_amount).toBeUndefined();
  });
});
