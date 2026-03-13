import { describe, expect, it, vi } from 'vitest';
import { configureTaxSettings } from '../../src/stripe/tax.js';

describe('configureTaxSettings', () => {
  it('returns requested behavior after account validation', async () => {
    const retrieve = vi.fn().mockResolvedValue({ id: 'acct_123' });
    const stripe = { accounts: { retrieve } } as any;

    const out = await configureTaxSettings(stripe, { behavior: 'automatic' });
    expect(retrieve).toHaveBeenCalledTimes(1);
    expect(out).toEqual({ behavior: 'automatic' });
  });

  it('propagates account retrieval errors', async () => {
    const retrieve = vi.fn().mockRejectedValue(new Error('network fail'));
    const stripe = { accounts: { retrieve } } as any;

    await expect(configureTaxSettings(stripe, { behavior: 'required' })).rejects.toThrow('network fail');
  });
});
