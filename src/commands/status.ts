import { createStripeClient } from '../stripe/client.js';
import { readConfig } from '../config/store.js';
import { showSummary, success, warn } from '../ui/display.js';

export async function statusCommand(): Promise<void> {
  const config = await readConfig();
  if (!config) {
    warn('No .stripe-ez.json found. Run `stripe-ez init` first.');
    return;
  }

  showSummary(config);

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    warn('No secret key provided for connectivity check. Set STRIPE_SECRET_KEY.');
    return;
  }

  const stripe = createStripeClient(key);
  await stripe.accounts.retrieve();
  success('\nConnection check passed.');
}
