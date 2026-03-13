function renderEventCases(events: string[]): string {
  if (events.length === 0) {
    return "    default:\n      break;";
  }

  return events
    .map((event) => `    case '${event}':\n      break;`)
    .join('\n');
}

export function generateNextAppWebhookSnippet(events: string[]): string {
  const cases = renderEventCases(events);
  return `import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
if (!webhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');

const stripe = new Stripe(stripeKey);

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headerStore = await headers();
    const signature = headerStore.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Store processed event IDs to make webhook handling idempotent.
    // Example: if (alreadyProcessed(event.id)) return NextResponse.json({ received: true });

    switch (event.type) {
${cases}
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 400 });
  }
}
`;
}

export function generateNextPagesWebhookSnippet(events: string[]): string {
  const cases = renderEventCases(events);
  return `import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
if (!webhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');

const stripe = new Stripe(stripeKey);

export const config = {
  api: {
    bodyParser: false
  }
};

async function readRawBody(req: NextApiRequest): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    const signature = req.headers['stripe-signature'];
    if (!signature || Array.isArray(signature)) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    const body = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Store processed event IDs to make webhook handling idempotent.
    // Example: if (alreadyProcessed(event.id)) return res.status(200).json({ received: true });

    switch (event.type) {
${cases}
    }

    res.status(200).json({ received: true });
  } catch {
    res.status(400).json({ error: 'Webhook handling failed' });
  }
}
`;
}

export function generateExpressWebhookSnippet(events: string[]): string {
  const cases = renderEventCases(events);
  return `import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripeKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeKey) throw new Error('Missing STRIPE_SECRET_KEY');
if (!webhookSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');

const stripe = new Stripe(stripeKey);

router.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const signature = req.headers['stripe-signature'];
    if (!signature || Array.isArray(signature)) {
      res.status(400).json({ error: 'Missing stripe-signature header' });
      return;
    }

    const body = req.body instanceof Buffer ? req.body.toString('utf8') : String(req.body);
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Store processed event IDs to make webhook handling idempotent.
    // Example: if (alreadyProcessed(event.id)) return res.json({ received: true });

    switch (event.type) {
${cases}
    }

    res.json({ received: true });
  } catch {
    res.status(400).json({ error: 'Webhook handling failed' });
  }
});

export default router;
`;
}
