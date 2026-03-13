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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const headerStore = await headers();
  const signature = headerStore.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
${cases}
  }

  return NextResponse.json({ received: true });
}
`;
}

export function generateNextPagesWebhookSnippet(events: string[]): string {
  const cases = renderEventCases(events);
  return `import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

  const signature = req.headers['stripe-signature'];
  if (!signature || Array.isArray(signature)) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  const body = await readRawBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  switch (event.type) {
${cases}
  }

  res.status(200).json({ received: true });
}
`;
}

export function generateExpressWebhookSnippet(events: string[]): string {
  const cases = renderEventCases(events);
  return `import express from 'express';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

router.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['stripe-signature'];
  if (!signature || Array.isArray(signature)) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    const body = req.body instanceof Buffer ? req.body.toString('utf8') : String(req.body);
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  switch (event.type) {
${cases}
  }

  res.json({ received: true });
});

export default router;
`;
}
