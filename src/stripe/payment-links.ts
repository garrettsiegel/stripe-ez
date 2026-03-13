import Stripe from 'stripe';

export async function createPaymentLinks(
  stripe: Stripe,
  priceIds: string[]
): Promise<Array<{ priceId: string; url: string }>> {
  const results: Array<{ priceId: string; url: string }> = [];
  for (const priceId of priceIds) {
    const link = await stripe.paymentLinks.create({
      line_items: [{ price: priceId, quantity: 1 }]
    });
    results.push({ priceId, url: link.url });
  }
  return results;
}
