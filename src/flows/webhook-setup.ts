import { confirm, checkbox } from '@inquirer/prompts';

export interface WebhookSetupResult {
  enabled: boolean;
  url?: string;
  events?: string[];
}

const EVENT_MAP: Record<string, string[]> = {
  'Payment completed (recommended)': ['payment_intent.succeeded', 'checkout.session.completed'],
  'Payment failed': ['payment_intent.payment_failed'],
  'Subscription started (recommended)': ['customer.subscription.created'],
  'Subscription canceled': ['customer.subscription.deleted'],
  'New customer created': ['customer.created'],
  'Invoice paid': ['invoice.paid']
};

function deriveWebhookUrl(): string {
  if (process.env.STRIPE_WEBHOOK_URL) {
    return process.env.STRIPE_WEBHOOK_URL;
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL || process.env.APP_URL || process.env.SITE_URL;
  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, '')}/api/webhooks/stripe`;
  }

  return 'http://localhost:3000/api/webhooks/stripe';
}

export async function setupWebhookPrompt(): Promise<WebhookSetupResult> {
  const enabled = await confirm({
    message: '\nSet up webhooks? (Stripe will send event notifications to your app URL)',
    default: false
  });

  if (!enabled) {
    return { enabled: false };
  }

  const url = deriveWebhookUrl();

  const selectedLabels = await checkbox({
    message: '\nChoose which events Stripe should send to your app',
    choices: [
      { name: 'Payment completed (recommended)', value: 'Payment completed (recommended)', checked: true },
      { name: 'Payment failed', value: 'Payment failed', checked: true },
      {
        name: 'Subscription started (recommended)',
        value: 'Subscription started (recommended)',
        checked: true
      },
      { name: 'Subscription canceled', value: 'Subscription canceled', checked: true },
      { name: 'New customer created', value: 'New customer created', checked: true },
      { name: 'Invoice paid', value: 'Invoice paid', checked: false }
    ]
  });

  const events = selectedLabels.flatMap((label) => EVENT_MAP[label] ?? []);
  return { enabled: true, url, events: [...new Set(events)] };
}
