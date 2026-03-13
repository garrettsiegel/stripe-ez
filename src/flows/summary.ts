import { confirm } from '@inquirer/prompts';
import { ProductCreateInput } from '../stripe/products.js';
import { CheckoutType } from './checkout-setup.js';
import { WebhookSetupResult } from './webhook-setup.js';

export async function confirmSetupSummary(input: {
  accountId: string;
  mode: 'test' | 'live';
  products: ProductCreateInput[];
  checkoutType: CheckoutType;
  webhook: WebhookSetupResult;
}): Promise<boolean> {
  console.log('\nHere is what I am going to set up in your Stripe account:\n');
  console.log(`Account: ${input.accountId}`);
  console.log(`Mode: ${input.mode}`);
  console.log('Products:');

  input.products.forEach((product, index) => {
    console.log(`  ${index + 1}. ${product.name} (${product.type})`);
    product.prices.forEach((price) => {
      const interval = price.interval ? `/${price.interval}` : '';
      console.log(`     - $${(price.amount / 100).toFixed(2)}${interval}`);
    });
  });

  console.log(`Checkout: ${input.checkoutType}`);
  if (input.webhook.enabled && input.webhook.url) {
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/.test(input.webhook.url);
    console.log(`Webhook: ${isLocal ? 'local dev (via Stripe CLI)' : input.webhook.url}`);
    input.webhook.events?.forEach((event) => console.log(`  -> ${event}`));
  } else {
    console.log('Webhooks: skipped for now');
  }

  return confirm({ message: '\nReview complete. Continue?', default: true });
}
