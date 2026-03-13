import { describe, expect, it } from 'vitest';
import { StripeEzConfig } from '../../src/config/schema.js';
import { generateExpressSnippet } from '../../src/generators/express.js';
import { generateNextAppSnippet } from '../../src/generators/nextjs-app.js';
import { generateNextPagesSnippet } from '../../src/generators/nextjs-pages.js';
import { generateReactSnippet } from '../../src/generators/react.js';
import { generateVanillaSnippet } from '../../src/generators/vanilla.js';
import { generateRawSnippet } from '../../src/generators/raw.js';
import {
  generateExpressWebhookSnippet,
  generateNextAppWebhookSnippet,
  generateNextPagesWebhookSnippet
} from '../../src/generators/webhook.js';

function makeConfig(products: StripeEzConfig['products']): StripeEzConfig {
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
    products,
    checkout: { type: 'hosted' }
  };
}

describe('checkout snippet generators', () => {
  it('generates express snippet with subscription mode and guards', () => {
    const config = makeConfig([
      {
        name: 'Pro',
        stripeProductId: 'prod_1',
        type: 'subscription',
        prices: [
          { amount: 1000, currency: 'usd', interval: 'month', stripePriceId: 'price_a', envVarName: 'A' },
          { amount: 1000, currency: 'usd', interval: 'month', stripePriceId: 'price_a', envVarName: 'B' },
          { amount: 2000, currency: 'usd', interval: 'year', stripePriceId: 'price_b', envVarName: 'C' }
        ]
      }
    ]);

    const out = generateExpressSnippet(config);
    expect(out).toContain("mode: 'subscription'");
    expect(out).toContain("new Set([\"price_a\",\"price_b\"])");
    expect(out).toContain("Invalid priceId");
    expect(out).toContain('idempotencyKey: `checkout:${requestId}:${priceId}`');
  });

  it('generates next app and next pages snippets with payment mode for non-subscription products', () => {
    const config = makeConfig([
      {
        name: 'One-time',
        stripeProductId: 'prod_2',
        type: 'one_time',
        prices: [{ amount: 500, currency: 'usd', stripePriceId: 'price_once', envVarName: 'ONE' }]
      }
    ]);

    const nextApp = generateNextAppSnippet(config);
    const nextPages = generateNextPagesSnippet(config);

    expect(nextApp).toContain("mode: 'payment'");
    expect(nextApp).toContain('status: 400');
    expect(nextApp).toContain('Unable to create checkout session');

    expect(nextPages).toContain("mode: 'payment'");
    expect(nextPages).toContain("req.method !== 'POST'");
    expect(nextPages).toContain('res.status(500).json({ error: \'Unable to create checkout session\' });');
    expect(nextPages).toContain('idempotencyKey: `checkout:${requestId}:${priceId}`');
  });

  it('generates next app and next pages snippets with subscription mode when any product is recurring', () => {
    const config = makeConfig([
      {
        name: 'Recurring',
        stripeProductId: 'prod_sub',
        type: 'subscription',
        prices: [{ amount: 999, currency: 'usd', interval: 'month', stripePriceId: 'price_sub', envVarName: 'SUB' }]
      }
    ]);

    const nextApp = generateNextAppSnippet(config);
    const nextPages = generateNextPagesSnippet(config);

    expect(nextApp).toContain("mode: 'subscription'");
    expect(nextPages).toContain("mode: 'subscription'");
  });

  it('generates express snippet with payment mode for one-time products', () => {
    const config = makeConfig([
      {
        name: 'Simple',
        stripeProductId: 'prod_simple',
        type: 'one_time',
        prices: [{ amount: 400, currency: 'usd', stripePriceId: 'price_simple', envVarName: 'SIMPLE' }]
      }
    ]);

    const out = generateExpressSnippet(config);
    expect(out).toContain("mode: 'payment'");
  });

  it('generates react and vanilla snippets with request id header and error handling', () => {
    const config = makeConfig([
      {
        name: 'Starter',
        stripeProductId: 'prod_3',
        type: 'one_time',
        prices: [{ amount: 300, currency: 'usd', stripePriceId: 'price_starter', envVarName: 'START' }]
      }
    ]);

    const react = generateReactSnippet(config);
    const vanilla = generateVanillaSnippet(config);

    expect(react).toContain("'X-Request-Id': crypto.randomUUID()");
    expect(react).toContain('alert(message);');
    expect(react).toContain('setLoading(false);');

    expect(vanilla).toContain("'X-Request-Id': crypto.randomUUID()");
    expect(vanilla).toContain("priceId: 'price_starter'");
    expect(vanilla).toContain('throw new Error(data.error || \'Checkout failed\')');
  });

  it('generates raw snippet fallback values when no products exist', () => {
    const out = generateRawSnippet(makeConfig([]));
    expect(out).toContain("mode: 'payment'");
    expect(out).toContain("price: 'price_xxx'");
    expect(out).toContain('idempotencyKey: `checkout:${requestId}:price_xxx`');
  });

  it('generates raw snippet in subscription mode when recurring product exists', () => {
    const out = generateRawSnippet(
      makeConfig([
        {
          name: 'Sub',
          stripeProductId: 'prod_sub',
          type: 'subscription',
          prices: [{ amount: 1000, currency: 'usd', interval: 'month', stripePriceId: 'price_sub', envVarName: 'SUB' }]
        }
      ])
    );

    expect(out).toContain("mode: 'subscription'");
    expect(out).toContain("price: 'price_sub'");
  });
});

describe('webhook snippet generators', () => {
  it('includes explicit event cases and missing-secret guards', () => {
    const events = ['checkout.session.completed', 'invoice.paid'];
    const nextApp = generateNextAppWebhookSnippet(events);
    const nextPages = generateNextPagesWebhookSnippet(events);
    const express = generateExpressWebhookSnippet(events);

    expect(nextApp).toContain("Missing STRIPE_SECRET_KEY");
    expect(nextApp).toContain("Missing STRIPE_WEBHOOK_SECRET");
    expect(nextApp).toContain("case 'checkout.session.completed':");

    expect(nextPages).toContain('bodyParser: false');
    expect(nextPages).toContain("case 'invoice.paid':");

    expect(express).toContain("express.raw({ type: 'application/json' })");
    expect(express).toContain('Webhook handling failed');
  });

  it('renders default switch case when no events are configured', () => {
    const out = generateNextAppWebhookSnippet([]);
    expect(out).toContain('default:');
    expect(out).toContain('break;');
  });
});
