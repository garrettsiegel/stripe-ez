import { StripeEzConfig } from '../config/schema.js';

export function generateNextAppSnippet(config: StripeEzConfig): string {
  const mode = config.products.some((p) => p.type === 'subscription') ? 'subscription' : 'payment';
  return `import Stripe from 'stripe';\nimport { NextResponse } from 'next/server';\n\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);\n\nexport async function POST(request: Request) {\n  const { priceId } = await request.json();\n\n  const session = await stripe.checkout.sessions.create({\n    mode: '${mode}',\n    payment_method_types: ['card'],\n    line_items: [{ price: priceId, quantity: 1 }],\n    success_url: \`${'${process.env.NEXT_PUBLIC_URL}'}/success?session_id={CHECKOUT_SESSION_ID}\`,\n    cancel_url: \`${'${process.env.NEXT_PUBLIC_URL}'}/cancel\`,\n  });\n\n  return NextResponse.json({ url: session.url });\n}\n`;
}
