import { StripeEzConfig } from '../config/schema.js';

export function generateRawSnippet(config: StripeEzConfig): string {
  const mode = config.products.some((p) => p.type === 'subscription') ? 'subscription' : 'payment';
  const priceId = config.products[0]?.prices[0]?.stripePriceId ?? 'price_xxx';
  return `const requestId = crypto.randomUUID();\n\nconst session = await stripe.checkout.sessions.create(\n  {\n    mode: '${mode}',\n    payment_method_types: ['card'],\n    line_items: [{ price: '${priceId}', quantity: 1 }],\n    success_url: 'https://example.com/success?session_id={CHECKOUT_SESSION_ID}',\n    cancel_url: 'https://example.com/cancel'\n  },\n  {\n    idempotencyKey: \`checkout:\${requestId}:${priceId}\`\n  }\n);\n`;
}
