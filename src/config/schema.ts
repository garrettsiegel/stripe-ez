export type StripeEzMode = 'test' | 'live';

export type AuthMethod = 'api_key' | 'stripe_cli' | 'oauth';

export type ProductType = 'one_time' | 'subscription' | 'donation';

export interface ConfigPrice {
  amount: number;
  currency: string;
  interval?: 'day' | 'week' | 'month' | 'year';
  stripePriceId: string;
  envVarName: string;
  trialDays?: number;
  usageType?: 'metered' | 'licensed';
  billingScheme?: 'per_unit' | 'tiered';
  tiers?: Array<{
    upTo?: number;
    flatAmount?: number;
    unitAmount?: number;
  }>;
}

export interface ConfigProduct {
  name: string;
  description?: string;
  stripeProductId: string;
  type: ProductType;
  prices: ConfigPrice[];
  trialDays?: number;
}

export interface ConfigPortal {
  configurationId: string;
  businessName: string;
  supportEmail?: string;
}

export interface ConfigTax {
  behavior: 'automatic' | 'required' | 'unset';
  registrationId?: string;
}

export interface ConfigWebhook {
  url: string;
  stripeEndpointId: string;
  events: string[];
  signingSecretHint?: string;
}

export interface StripeEzConfig {
  version: string;
  accountId: string;
  mode: StripeEzMode;
  createdAt: string;
  auth: {
    method: AuthMethod;
    keyHint: string;
    publishableKey?: string;
    stripeCliVersion?: string;
  };
  products: ConfigProduct[];
  webhook?: ConfigWebhook;
  checkout: {
    type: 'hosted' | 'payment_links' | 'embedded';
  };
  portal?: ConfigPortal;
  tax?: ConfigTax;
}

export function isStripeEzConfig(value: unknown): value is StripeEzConfig {
  if (!value || typeof value !== 'object') return false;
  const raw = value as Record<string, unknown>;
  const rawAuth = raw.auth as Record<string, unknown> | undefined;
  return (
    typeof raw.version === 'string' &&
    typeof raw.accountId === 'string' &&
    (raw.mode === 'test' || raw.mode === 'live') &&
    typeof raw.createdAt === 'string' &&
    typeof rawAuth === 'object' &&
    rawAuth !== null &&
    typeof rawAuth.method === 'string' &&
    typeof rawAuth.keyHint === 'string' &&
    (typeof rawAuth.publishableKey === 'undefined' || typeof rawAuth.publishableKey === 'string') &&
    (typeof rawAuth.stripeCliVersion === 'undefined' || typeof rawAuth.stripeCliVersion === 'string') &&
    Array.isArray(raw.products) &&
    typeof raw.checkout === 'object' &&
    (typeof raw.portal === 'undefined' || typeof raw.portal === 'object') &&
    (typeof raw.tax === 'undefined' || typeof raw.tax === 'object')
  );
}
