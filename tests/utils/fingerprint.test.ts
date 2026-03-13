import { describe, expect, it } from 'vitest';
import { fingerprintProductInput } from '../../src/utils/fingerprint.js';

describe('fingerprintProductInput', () => {
  it('changes fingerprint when advanced pricing fields change', () => {
    const base = {
      name: 'Usage Plan',
      type: 'subscription' as const,
      prices: [
        {
          amount: 0,
          currency: 'usd',
          interval: 'month' as const,
          usageType: 'metered' as const,
          billingScheme: 'tiered' as const,
          tiers: [{ upTo: 1000, unitAmount: 100 }, { unitAmount: 80 }]
        }
      ]
    };

    const changed = {
      ...base,
      prices: [
        {
          ...base.prices[0],
          tiers: [{ upTo: 1000, unitAmount: 120 }, { unitAmount: 90 }]
        }
      ]
    };

    expect(fingerprintProductInput(base)).not.toBe(fingerprintProductInput(changed));
  });
});
