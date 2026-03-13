import { describe, expect, it, vi } from 'vitest';
import { createPaymentLinks } from '../../src/stripe/payment-links.js';

describe('createPaymentLinks', () => {
  it('creates one link per price id in order', async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({ url: 'https://pay.test/1' })
      .mockResolvedValueOnce({ url: 'https://pay.test/2' });

    const stripe = {
      paymentLinks: { create }
    } as any;

    const out = await createPaymentLinks(stripe, ['price_1', 'price_2']);
    expect(out).toEqual([
      { priceId: 'price_1', url: 'https://pay.test/1' },
      { priceId: 'price_2', url: 'https://pay.test/2' }
    ]);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('returns empty array for empty input', async () => {
    const stripe = { paymentLinks: { create: vi.fn() } } as any;
    await expect(createPaymentLinks(stripe, [])).resolves.toEqual([]);
    expect(stripe.paymentLinks.create).not.toHaveBeenCalled();
  });
});
