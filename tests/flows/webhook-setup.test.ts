import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const confirmMock = vi.fn();
const checkboxMock = vi.fn();

vi.mock('@inquirer/prompts', () => ({
  confirm: confirmMock,
  checkbox: checkboxMock
}));

describe('setupWebhookPrompt', () => {
  const prevWebhook = process.env.STRIPE_WEBHOOK_URL;
  const prevPublicUrl = process.env.NEXT_PUBLIC_URL;
  const prevAppUrl = process.env.APP_URL;
  const prevSiteUrl = process.env.SITE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.STRIPE_WEBHOOK_URL;
    delete process.env.NEXT_PUBLIC_URL;
    delete process.env.APP_URL;
    delete process.env.SITE_URL;
  });

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_URL = prevWebhook;
    process.env.NEXT_PUBLIC_URL = prevPublicUrl;
    process.env.APP_URL = prevAppUrl;
    process.env.SITE_URL = prevSiteUrl;
  });

  it('returns disabled when user opts out', async () => {
    confirmMock.mockResolvedValue(false);
    const { setupWebhookPrompt } = await import('../../src/flows/webhook-setup.js');
    await expect(setupWebhookPrompt()).resolves.toEqual({ enabled: false });
  });

  it('derives url from NEXT_PUBLIC_URL and maps selected events', async () => {
    process.env.NEXT_PUBLIC_URL = 'https://myapp.test/';
    confirmMock.mockResolvedValue(true);
    checkboxMock.mockResolvedValue(['Payment completed (recommended)', 'Payment completed (recommended)', 'Invoice paid']);

    const { setupWebhookPrompt } = await import('../../src/flows/webhook-setup.js');
    const out = await setupWebhookPrompt();

    expect(out.enabled).toBe(true);
    expect(out.url).toBe('https://myapp.test/api/webhooks/stripe');
    expect(out.events).toEqual(['payment_intent.succeeded', 'checkout.session.completed', 'invoice.paid']);
  });

  it('throws for insecure non-localhost http webhook urls', async () => {
    process.env.STRIPE_WEBHOOK_URL = 'http://example.com/webhook';
    confirmMock.mockResolvedValue(true);

    const { setupWebhookPrompt } = await import('../../src/flows/webhook-setup.js');
    await expect(setupWebhookPrompt()).rejects.toThrow(/must use https/i);
  });
});
