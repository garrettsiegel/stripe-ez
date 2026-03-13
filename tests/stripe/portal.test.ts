import { describe, expect, it, vi } from 'vitest';
import { createOrUpdatePortalConfig } from '../../src/stripe/portal.js';

function makeStripeMock() {
  return {
    billingPortal: {
      configurations: {
        list: vi.fn().mockResolvedValue({ data: [] }),
        create: vi.fn().mockResolvedValue({ id: 'bpc_new' }),
        update: vi.fn().mockResolvedValue({ id: 'bpc_existing' })
      }
    }
  } as any;
}

describe('createOrUpdatePortalConfig', () => {
  it('creates a new managed config when one does not exist', async () => {
    const stripe = makeStripeMock();
    const out = await createOrUpdatePortalConfig(stripe, {
      businessName: 'Acme',
      supportEmail: 'help@acme.test'
    });

    expect(stripe.billingPortal.configurations.create).toHaveBeenCalledTimes(1);
    expect(stripe.billingPortal.configurations.update).not.toHaveBeenCalled();
    expect(out).toEqual({
      configurationId: 'bpc_new',
      businessName: 'Acme',
      supportEmail: 'help@acme.test'
    });
  });

  it('updates existing managed config when found', async () => {
    const stripe = makeStripeMock();
    stripe.billingPortal.configurations.list.mockResolvedValue({
      data: [{ id: 'bpc_existing', metadata: { stripeEz: 'true' } }]
    });

    const out = await createOrUpdatePortalConfig(stripe, {
      businessName: 'Acme 2'
    });

    expect(stripe.billingPortal.configurations.update).toHaveBeenCalledWith(
      'bpc_existing',
      expect.objectContaining({
        business_profile: { headline: 'Acme 2' }
      })
    );
    expect(stripe.billingPortal.configurations.create).not.toHaveBeenCalled();
    expect(out).toEqual({
      configurationId: 'bpc_existing',
      businessName: 'Acme 2',
      supportEmail: undefined
    });
  });
});
