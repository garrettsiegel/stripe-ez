import { promises as fs } from 'node:fs';
import path from 'node:path';
import { StripeEzConfig } from '../config/schema.js';

export const PUBLIC_CONFIG_FILE = 'stripe-config.json';

interface PublicProductConfig {
  productId: string;
  prices: Record<string, string>;
}

interface PublicStripeConfig {
  mode: 'test' | 'live';
  accountId: string;
  checkout: StripeEzConfig['checkout']['type'];
  publishableKey?: string;
  webhookEndpointId?: string;
  portalConfigurationId?: string;
  taxBehavior?: 'automatic' | 'required' | 'unset';
  products: Record<string, PublicProductConfig>;
}

function toProductKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function toPriceKey(interval: string | undefined, currency: string): string {
  if (!interval) return currency.toLowerCase();
  return `${interval.toLowerCase()}_${currency.toLowerCase()}`;
}

export function renderPublicConfigJson(config: StripeEzConfig): string {
  const products: Record<string, PublicProductConfig> = {};

  for (const product of config.products) {
    const productKey = toProductKey(product.name);
    products[productKey] = {
      productId: product.stripeProductId,
      prices: Object.fromEntries(
        product.prices.map((price) => [toPriceKey(price.interval, price.currency), price.stripePriceId])
      )
    };
  }

  const out: PublicStripeConfig = {
    mode: config.mode,
    accountId: config.accountId,
    checkout: config.checkout.type,
    publishableKey: config.auth.publishableKey,
    webhookEndpointId: config.webhook?.stripeEndpointId,
    portalConfigurationId: config.portal?.configurationId,
    taxBehavior: config.tax?.behavior,
    products
  };

  return `${JSON.stringify(out, null, 2)}\n`;
}

export async function writePublicConfigFile(config: StripeEzConfig, cwd = process.cwd()): Promise<void> {
  const publicPath = path.join(cwd, PUBLIC_CONFIG_FILE);
  await fs.writeFile(publicPath, renderPublicConfigJson(config), 'utf8');
}
