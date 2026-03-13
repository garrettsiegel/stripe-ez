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
    expect(out).not.toContain('"accountId"');
    expect(out).toContain('"portalConfigurationId": "bpc_123"');
    expect(out).toContain('"taxBehavior": "automatic"');
    expect(out).toContain('"starter_plan"');
  });

  it('normalizes product keys and maps price keys by interval and currency', () => {
    const config: StripeEzConfig = {
      version: '1.0.0',
      accountId: 'acct_123',
      mode: 'test',
      createdAt: new Date().toISOString(),
      auth: {
        method: 'stripe_cli',
        keyHint: 'sk_test...1234'
      },
      products: [
        {
          name: '  Starter+++ Plan  ',
          stripeProductId: 'prod_123',
          type: 'subscription',
          prices: [
            {
              amount: 900,
              currency: 'USD',
              interval: 'month',
              stripePriceId: 'price_month',
              envVarName: 'STARTER_USD_MONTH_PRICE_ID'
            },
            {
              amount: 900,
              currency: 'EUR',
              stripePriceId: 'price_eur',
              envVarName: 'STARTER_EUR_PRICE_ID'
            }
          ]
        }
      ],
      checkout: { type: 'hosted' }
    };

    const parsed = JSON.parse(renderPublicConfigJson(config));
    expect(parsed.products.starter_plan.productId).toBe('prod_123');
    expect(parsed.products.starter_plan.prices.month_usd).toBe('price_month');
    expect(parsed.products.starter_plan.prices.eur).toBe('price_eur');
  });

  it('uses empty string key when product name normalizes to empty', () => {
    const config: StripeEzConfig = {
      version: '1.0.0',
      accountId: 'acct_123',
      mode: 'test',
      createdAt: new Date().toISOString(),
      auth: {
        method: 'api_key',
        keyHint: 'sk_test...1234'
      },
      products: [
        {
          name: '!!!',
          stripeProductId: 'prod_empty',
          type: 'one_time',
          prices: [
            {
              amount: 100,
              currency: 'usd',
              stripePriceId: 'price_1',
              envVarName: 'PRICE_1'
            }
          ]
        }
      ],
      checkout: { type: 'hosted' }
    };

    const parsed = JSON.parse(renderPublicConfigJson(config));
    expect(parsed.products[''].productId).toBe('prod_empty');
  });
});
