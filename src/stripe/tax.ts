import Stripe from 'stripe';

export interface TaxConfigInput {
  behavior: 'automatic' | 'required' | 'unset';
}

export interface TaxConfigResult {
  behavior: 'automatic' | 'required' | 'unset';
}

export async function configureTaxSettings(stripe: Stripe, input: TaxConfigInput): Promise<TaxConfigResult> {
  // Validate account accessibility; some tax capabilities are region/account dependent.
  await stripe.accounts.retrieve();
  return { behavior: input.behavior };
}
