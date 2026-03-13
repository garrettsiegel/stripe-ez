import { describe, expect, it } from 'vitest';
import { isStripeEzConfig, StripeEzConfig } from '../../src/config/schema.js';

function makeConfig(overrides: Partial<StripeEzConfig> = {}): StripeEzConfig {
  return {
    version: '1.0.0',
    accountId: 'acct_123',
    mode: 'test',
    createdAt: new Date().toISOString(),
    auth: {
      method: 'api_key',
      keyHint: 'sk_test...1234',
      publishableKey: 'pk_test_123'
    },
    products: [],
    checkout: { type: 'hosted' },
    ...overrides
  };
}

describe('isStripeEzConfig', () => {
  it('accepts a valid config', () => {
    expect(isStripeEzConfig(makeConfig())).toBe(true);
  });

  it('rejects null and primitive values', () => {
    expect(isStripeEzConfig(null)).toBe(false);
    expect(isStripeEzConfig(undefined)).toBe(false);
    expect(isStripeEzConfig('nope')).toBe(false);
  });

  it('rejects missing required fields', () => {
    const missingMode = { ...makeConfig(), mode: undefined } as unknown;
    expect(isStripeEzConfig(missingMode)).toBe(false);
  });

  it('rejects invalid mode values', () => {
    const invalid = { ...makeConfig(), mode: 'staging' } as unknown;
    expect(isStripeEzConfig(invalid)).toBe(false);
  });

  it('rejects invalid auth values', () => {
    const invalid = makeConfig({ auth: { method: 'api_key', keyHint: 123 as unknown as string } as any });
    expect(isStripeEzConfig(invalid)).toBe(false);
  });
});
