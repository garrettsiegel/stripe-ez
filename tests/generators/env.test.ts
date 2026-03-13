import { describe, expect, it } from 'vitest';
import { renderEnv } from '../../src/generators/env.js';
import { StripeEzConfig } from '../../src/config/schema.js';

describe('renderEnv', () => {
  it('includes key ids and price ids', () => {
    const secretKey = ['sk', 'test', 'abc'].join('_');

    const config: StripeEzConfig = {
      version: '1.0.0',
      accountId: 'acct_123',
      mode: 'test',
      createdAt: new Date().toISOString(),
      auth: { method: 'api_key', keyHint: 'sk_test...1234' },
      products: [
        {
          name: 'Pro Plan',
          stripeProductId: 'prod_1',
          type: 'subscription',
          prices: [
            {
              amount: 1900,
              currency: 'usd',
              interval: 'month',
              stripePriceId: 'price_1',
              envVarName: 'PRO_MONTHLY_PRICE_ID'
            }
          ]
        }
      ],
      checkout: { type: 'hosted' }
    };

    const env = renderEnv({ config, secretKey });
    expect(env).toContain(`STRIPE_SECRET_KEY=${secretKey}`);
    expect(env).toContain('PRO_MONTHLY_PRICE_ID=price_1');
  });

  it('throws when env var name is not safe', () => {
    const config: StripeEzConfig = {
      version: '1.0.0',
      accountId: 'acct_123',
      mode: 'test',
      createdAt: new Date().toISOString(),
      auth: { method: 'api_key', keyHint: 'sk_test...1234' },
      products: [
        {
          name: 'Bad Name',
          stripeProductId: 'prod_1',
          type: 'one_time',
          prices: [
            {
              amount: 1900,
              currency: 'usd',
              stripePriceId: 'price_1',
              envVarName: '1BAD-NAME'
            }
          ]
        }
      ],
      checkout: { type: 'hosted' }
    };

    expect(() => renderEnv({ config, secretKey: 'sk_test_abc' })).toThrow(/invalid environment variable name/i);
  });

  it('renders webhook placeholder when webhook exists but secret is not provided', () => {
    const config: StripeEzConfig = {
      version: '1.0.0',
      accountId: 'acct_123',
      mode: 'test',
      createdAt: new Date().toISOString(),
      auth: { method: 'api_key', keyHint: 'sk_test...1234' },
      products: [],
      webhook: {
        url: 'http://localhost:3000/api/webhooks/stripe',
        stripeEndpointId: 'we_123',
        events: ['checkout.session.completed']
      },
      checkout: { type: 'hosted' }
    };

    const env = renderEnv({ config, secretKey: 'sk_test_abc' });
    expect(env).toContain('# STRIPE_WEBHOOK_SECRET= # paste from: stripe listen --forward-to http://localhost:3000/api/webhooks/stripe');
  });
});
