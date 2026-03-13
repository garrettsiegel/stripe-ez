import { describe, expect, it } from 'vitest';
import { renderEnv } from '../../src/generators/env.js';
import { StripeEzConfig } from '../../src/config/schema.js';

describe('init flow artifacts', () => {
  it('renders env entries for webhook, portal, and tax when configured', () => {
    const secretKey = ['sk', 'test', 'abc'].join('_');
    const publishableKey = ['pk', 'test', '123'].join('_');
    const webhookSecret = ['whsec', 'abc'].join('_');

    const config: StripeEzConfig = {
      version: '1.0.0',
      accountId: 'acct_123',
      mode: 'test',
      createdAt: new Date().toISOString(),
      auth: {
        method: 'stripe_cli',
        keyHint: 'sk_test...1234',
        publishableKey
      },
      products: [],
      webhook: {
        url: 'https://example.com/webhooks/stripe',
        stripeEndpointId: 'we_123',
        events: ['checkout.session.completed']
      },
      checkout: { type: 'hosted' },
      portal: { configurationId: 'bpc_123', businessName: 'Acme' },
      tax: { behavior: 'required' }
    };

    const out = renderEnv({
      config,
      secretKey,
      publishableKey,
      webhookSecret
    });

    expect(out).toContain(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);
    expect(out).toContain('STRIPE_PORTAL_CONFIG_ID=bpc_123');
    expect(out).toContain('STRIPE_TAX_BEHAVIOR=required');
  });
});
