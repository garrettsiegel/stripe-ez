import Stripe from 'stripe';
import { fingerprintProductInput } from '../utils/fingerprint.js';

export interface ProductCreateInput {
  name: string;
  description?: string;
  type: 'one_time' | 'subscription' | 'donation';
  prices: Array<{
    amount: number;
    currency: string;
    interval?: 'month' | 'year';
    trialDays?: number;
    usageType?: 'metered' | 'licensed';
    billingScheme?: 'per_unit' | 'tiered';
    tiers?: Array<{
      upTo?: number;
      flatAmount?: number;
      unitAmount?: number;
    }>;
  }>;
}

export interface CreatedProduct {
  name: string;
  description?: string;
  stripeProductId: string;
  type: 'one_time' | 'subscription' | 'donation';
  prices: Array<{
    amount: number;
    currency: string;
    interval?: 'month' | 'year';
    trialDays?: number;
    stripePriceId: string;
    usageType?: 'metered' | 'licensed';
    billingScheme?: 'per_unit' | 'tiered';
    tiers?: Array<{
      upTo?: number;
      flatAmount?: number;
      unitAmount?: number;
    }>;
  }>;
}

export async function createProductWithPrices(
  stripe: Stripe,
  input: ProductCreateInput
): Promise<CreatedProduct> {
  const productFingerprint = fingerprintProductInput(input);

  const existingProducts = await stripe.products.list({ limit: 100, active: true });
  const existingProduct = existingProducts.data.find(
    (product) => product.metadata?.stripeEzFingerprint === productFingerprint
  );

  const product =
    existingProduct ??
    (await stripe.products.create(
      {
        name: input.name,
        description: input.description,
        metadata: {
          stripeEz: 'true',
          type: input.type,
          stripeEzFingerprint: productFingerprint
        }
      },
      {
        idempotencyKey: `stripe-ez-product-${productFingerprint}`
      }
    ));

  const createdPrices: CreatedProduct['prices'] = [];
  const existingPrices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  for (const price of input.prices) {
    const priceFingerprint = [
      price.amount,
      price.currency.toLowerCase(),
      price.interval ?? 'one_time',
      price.trialDays ?? 'none',
      price.usageType ?? 'licensed',
      price.billingScheme ?? 'per_unit',
      JSON.stringify(price.tiers ?? [])
    ].join(':');
    const existingPrice = existingPrices.data.find(
      (candidate) => candidate.metadata?.stripeEzPriceFingerprint === priceFingerprint
    );

    const tiers =
      price.billingScheme === 'tiered' && price.tiers?.length
        ? price.tiers.map((tier) => ({
            up_to: tier.upTo ?? ('inf' as const),
            flat_amount: tier.flatAmount,
            unit_amount: tier.unitAmount
          }))
        : undefined;

    const created =
      existingPrice ??
      (await stripe.prices.create(
        {
          product: product.id,
          currency: price.currency,
          unit_amount: price.billingScheme === 'tiered' ? undefined : price.amount,
          billing_scheme: price.billingScheme,
          tiers,
          tiers_mode: tiers ? 'graduated' : undefined,
          recurring: price.interval
            ? {
                interval: price.interval,
                trial_period_days: price.trialDays,
                usage_type: price.usageType ?? 'licensed'
              }
            : undefined,
          metadata: {
            stripeEz: 'true',
            stripeEzPriceFingerprint: priceFingerprint
          }
        },
        {
          idempotencyKey: `stripe-ez-price-${product.id}-${priceFingerprint}`
        }
      ));

    createdPrices.push({
      amount: price.amount,
      currency: price.currency,
      interval: price.interval,
      trialDays: price.trialDays,
      stripePriceId: created.id,
      usageType: price.usageType,
      billingScheme: price.billingScheme,
      tiers: price.tiers
    });
  }

  return {
    name: input.name,
    description: input.description,
    stripeProductId: product.id,
    type: input.type,
    prices: createdPrices
  };
}
