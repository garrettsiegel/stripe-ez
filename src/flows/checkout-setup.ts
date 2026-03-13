import { select } from '@inquirer/prompts';

export type CheckoutType = 'hosted' | 'payment_links' | 'embedded';

export async function chooseCheckoutType(): Promise<CheckoutType> {
  return select({
    message: '\nChoose how customers will pay',
    choices: [
      { name: 'Stripe Checkout (recommended: hosted page, quickest setup)', value: 'hosted' },
      { name: 'Payment Links (shareable URL - no code needed)', value: 'payment_links' },
      { name: 'Embedded form (Stripe Elements - most customizable)', value: 'embedded' }
    ]
  });
}
