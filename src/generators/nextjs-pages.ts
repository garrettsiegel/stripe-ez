import { StripeEzConfig } from '../config/schema.js';

export function generateNextPagesSnippet(config: StripeEzConfig): string {
  const mode = config.products.some((p) => p.type === 'subscription') ? 'subscription' : 'payment';
  return `import type { NextApiRequest, NextApiResponse } from 'next';\nimport Stripe from 'stripe';\n\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);\n\nexport default async function handler(req: NextApiRequest, res: NextApiResponse) {\n  if (req.method !== 'POST') {\n    res.status(405).end('Method Not Allowed');\n    return;\n  }\n\n  const { priceId } = req.body;\n  const session = await stripe.checkout.sessions.create({\n    mode: '${mode}',\n    payment_method_types: ['card'],\n    line_items: [{ price: priceId, quantity: 1 }],\n    success_url: \`${'${process.env.NEXT_PUBLIC_URL}'}/success?session_id={CHECKOUT_SESSION_ID}\`,\n    cancel_url: \`${'${process.env.NEXT_PUBLIC_URL}'}/cancel\`\n  });\n\n  res.status(200).json({ url: session.url });\n}\n`;
}
