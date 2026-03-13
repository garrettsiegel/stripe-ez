import { describe, expect, it } from 'vitest';
import { toUserFacingError } from '../../src/utils/errors.js';

describe('toUserFacingError', () => {
  it('maps Stripe rate limit errors', () => {
    const out = toUserFacingError({ type: 'StripeRateLimitError' });
    expect(out.code).toBe('RATE_LIMITED');
  });

  it('maps Stripe auth errors', () => {
    const out = toUserFacingError({ type: 'StripeAuthenticationError' });
    expect(out.code).toBe('INVALID_API_KEY');
  });

  it('maps Stripe permission errors', () => {
    const out = toUserFacingError({ type: 'StripePermissionError' });
    expect(out.code).toBe('PERMISSION_DENIED');
  });

  it('maps Stripe connection errors', () => {
    const out = toUserFacingError({ type: 'StripeConnectionError' });
    expect(out.code).toBe('NETWORK_FAILURE');
  });

  it('falls back to UNKNOWN with message if present', () => {
    const out = toUserFacingError({ message: 'boom' });
    expect(out.code).toBe('UNKNOWN');
    expect(out.message).toBe('boom');
  });
});
