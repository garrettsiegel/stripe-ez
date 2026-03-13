import { ConfigProduct } from '../config/schema.js';
import { ProductCreateInput } from '../stripe/products.js';

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizeDescription(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}

function serializePrice(price: {
  amount: number;
  currency: string;
  interval?: 'day' | 'week' | 'month' | 'year';
  usageType?: 'metered' | 'licensed';
  billingScheme?: 'per_unit' | 'tiered';
  tiers?: Array<{ upTo?: number; flatAmount?: number; unitAmount?: number }>;
}): string {
  return [
    price.amount,
    price.currency.toLowerCase(),
    price.interval ?? 'one_time',
    price.usageType ?? 'licensed',
    price.billingScheme ?? 'per_unit',
    price.tiers ? JSON.stringify(price.tiers) : 'notiers'
  ].join(':');
}

export function fingerprintProductInput(input: ProductCreateInput): string {
  const prices = input.prices.map(serializePrice).sort().join('|');
  return [normalizeName(input.name), normalizeDescription(input.description), input.type, prices].join('::');
}

export function fingerprintConfigProduct(product: ConfigProduct): string {
  const prices = product.prices
    .map((price) =>
      serializePrice({
        amount: price.amount,
        currency: price.currency,
        interval: price.interval,
        usageType: price.usageType,
        billingScheme: price.billingScheme,
        tiers: price.tiers
      })
    )
    .sort()
    .join('|');

  return [normalizeName(product.name), normalizeDescription(product.description), product.type, prices].join('::');
}
