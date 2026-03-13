import { describe, expect, it } from 'vitest';
import { renderPublicConfigJson } from '../../src/generators/config-json.js';
import { StripeEzConfig } from '../../src/config/schema.js';

describe('renderPublicConfigJson', () => {
  it('renders commit-safe Stripe config with portal and tax metadata', () => {
    const config: StripeEzConfig = {
      version: '1.0.0',
      accountId: 'acct_123',
      mode: 'test',
      createdAt: new Date().toISOString(),
      auth: {
        method: 'stripe_cli',
        keyHint: 'sk_test...1234',
        publishableKey: 'pk_test_abc'
      },
      products: [
        {
          name: 'Starter Plan',
          stripeProductId: 'prod_123',
          type: 'subscription',
          prices: [
            {
              amount: 900,
              currency: 'usd',
              interval: 'month',
              stripePriceId: 'price_month',
              envVarName: 'STARTER_USD_MONTH_PRICE_ID'
            }
          ]
        }
      ],
      webhook: {
        url: 'https://example.com/webhooks/stripe',
        stripeEndpointId: 'we_123',
        events: ['checkout.session.completed']
      },
      checkout: { type: 'hosted' },
      portal: { configurationId: 'bpc_123', businessName: 'Acme' },
      tax: { behavior: 'automatic' }
    };

    const out = renderPublicConfigJson(config);
    expect(out).toContain('"accountId": "acct_123"');
    expect(out).toContain('"portalConfigurationId": "bpc_123"');
    expect(out).toContain('"taxBehavior": "automatic"');
    expect(out).toContain('"starter_plan"');
  });
});
