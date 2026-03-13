export type UserFacingErrorCode =
  | 'INVALID_API_KEY'
  | 'NETWORK_FAILURE'
  | 'RATE_LIMITED'
  | 'PERMISSION_DENIED'
  | 'INVALID_INPUT'
  | 'UNKNOWN';

export interface UserFacingError {
  code: UserFacingErrorCode;
  message: string;
  fix: string;
}

export function toUserFacingError(error: unknown): UserFacingError {
  const err = error as { code?: string; type?: string; message?: string };

  if (err?.code === 'rate_limit' || err?.type === 'StripeRateLimitError') {
    return {
      code: 'RATE_LIMITED',
      message: 'Stripe is rate-limiting requests. Waiting 5 seconds before retrying...',
      fix: 'Try again in a few seconds.'
    };
  }

  if (err?.type === 'StripeAuthenticationError') {
    return {
      code: 'INVALID_API_KEY',
      message:
        "That API key doesn't seem to work. Make sure you're copying the secret key (starts with sk_test_ or sk_live_) from dashboard.stripe.com/apikeys",
      fix: 'Use a valid secret key from Stripe Dashboard > Developers > API keys.'
    };
  }

  if (err?.type === 'StripePermissionError') {
    return {
      code: 'PERMISSION_DENIED',
      message:
        "Your API key doesn't have permission to create products. You need a key with write access to Products and Prices.",
      fix: 'Use an unrestricted key or update restricted key permissions.'
    };
  }

  if (err?.type === 'StripeConnectionError') {
    return {
      code: 'NETWORK_FAILURE',
      message: "Can't reach Stripe's API. Check your internet connection and try again.",
      fix: 'Confirm internet access and retry.'
    };
  }

  return {
    code: 'UNKNOWN',
    message: err?.message ?? 'Something went wrong while talking to Stripe.',
    fix: 'Re-run with --verbose for details.'
  };
}
