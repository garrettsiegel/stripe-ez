import { StripeEzConfig } from '../config/schema.js';

export function generateExpressSnippet(config: StripeEzConfig): string {
  const mode = config.products.some((p) => p.type === 'subscription') ? 'subscription' : 'payment';
  return `import express from 'express';\nimport Stripe from 'stripe';\n\nconst app = express();\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);\n\napp.use(express.json());\n\napp.post('/api/checkout', async (req, res) => {\n  const { priceId } = req.body;\n\n  const session = await stripe.checkout.sessions.create({\n    mode: '${mode}',\n    payment_method_types: ['card'],\n    line_items: [{ price: priceId, quantity: 1 }],\n    success_url: \`${'${process.env.APP_URL}'}/success?session_id={CHECKOUT_SESSION_ID}\`,\n    cancel_url: \`${'${process.env.APP_URL}'}/cancel\`\n  });\n\n  res.json({ url: session.url });\n});\n\napp.listen(3000);\n`;
}
