import { beforeEach, describe, expect, it, vi } from 'vitest';

const retrieveMock = vi.fn();
const stripeCtorSpy = vi.fn();

class StripeMock {
  accounts = {
    retrieve: retrieveMock
  };

  constructor(secretKey: string, options: unknown) {
    stripeCtorSpy(secretKey, options);
  }
}

vi.mock('stripe', () => ({
  default: StripeMock
}));

describe('stripe client', () => {
  beforeEach(() => {
    retrieveMock.mockReset();
    stripeCtorSpy.mockClear();
  });

  it('creates client with retry config', async () => {
    const { createStripeClient } = await import('../../src/stripe/client.js');
    createStripeClient('sk_test_123');

    expect(stripeCtorSpy).toHaveBeenCalledWith('sk_test_123', { maxNetworkRetries: 2 });
  });

  it('validates key by retrieving account', async () => {
    retrieveMock.mockResolvedValue({ id: 'acct_123' });
    const { validateStripeKey } = await import('../../src/stripe/client.js');

    const out = await validateStripeKey('sk_test_123');
    expect(out).toEqual({ accountId: 'acct_123' });
  });
});
