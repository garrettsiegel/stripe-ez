import Stripe from 'stripe';

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    maxNetworkRetries: 2
  });
}

export async function validateStripeKey(secretKey: string): Promise<{ accountId: string }> {
  const stripe = createStripeClient(secretKey);
  const account = await stripe.accounts.retrieve();
  return { accountId: account.id };
}
