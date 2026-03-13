import { describe, expect, it, vi } from 'vitest';
import { createWebhookEndpoint } from '../../src/stripe/webhooks.js';

function makeStripeMock() {
  return {
    webhookEndpoints: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn().mockResolvedValue({ id: 'we_new', secret: 'whsec_1234567890abcd' })
    }
  } as any;
}

describe('createWebhookEndpoint', () => {
  it('reuses existing endpoint by url', async () => {
    const stripe = makeStripeMock();
    stripe.webhookEndpoints.list.mockResolvedValue({ data: [{ id: 'we_existing', url: 'https://a.test/webhook' }] });

    const out = await createWebhookEndpoint(stripe, {
      url: 'https://a.test/webhook',
      events: ['checkout.session.completed']
    });

    expect(out).toEqual({ endpointId: 'we_existing' });
    expect(stripe.webhookEndpoints.create).not.toHaveBeenCalled();
  });

  it('creates endpoint and returns masked secret hint', async () => {
    const stripe = makeStripeMock();
    const out = await createWebhookEndpoint(stripe, {
      url: 'https://a.test/webhook',
      events: ['checkout.session.completed']
    });

    expect(stripe.webhookEndpoints.create).toHaveBeenCalledTimes(1);
    expect(out.endpointId).toBe('we_new');
    expect(out.secret).toBe('whsec_1234567890abcd');
    expect(out.secretHint).toBe('whsec_12...abcd');
  });
});
