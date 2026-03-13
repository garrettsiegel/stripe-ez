import Stripe from 'stripe';

export interface PortalConfigInput {
  businessName: string;
  supportEmail?: string;
}

export interface PortalConfigResult {
  configurationId: string;
  businessName: string;
  supportEmail?: string;
}

export async function createOrUpdatePortalConfig(
  stripe: Stripe,
  input: PortalConfigInput
): Promise<PortalConfigResult> {
  const existing = await stripe.billingPortal.configurations.list({ limit: 25 });
  const managed = existing.data.find((item) => item.metadata?.stripeEz === 'true');

  const payload: Stripe.BillingPortal.ConfigurationCreateParams = {
    business_profile: {
      headline: input.businessName
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ['address', 'email', 'name', 'phone', 'shipping', 'tax_id']
      },
      invoice_history: {
        enabled: true
      },
      payment_method_update: {
        enabled: true
      },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        proration_behavior: 'none'
      }
    },
    metadata: {
      stripeEz: 'true',
      supportEmail: input.supportEmail ?? ''
    }
  };

  if (managed) {
    const updated = await stripe.billingPortal.configurations.update(managed.id, payload);
    return {
      configurationId: updated.id,
      businessName: input.businessName,
      supportEmail: input.supportEmail
    };
  }

  const created = await stripe.billingPortal.configurations.create(payload);
  return {
    configurationId: created.id,
    businessName: input.businessName,
    supportEmail: input.supportEmail
  };
}
