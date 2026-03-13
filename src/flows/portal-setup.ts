import { confirm, input } from '@inquirer/prompts';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PortalSetupResult {
  enabled: boolean;
  businessName?: string;
  supportEmail?: string;
}

export async function setupPortalPrompt(): Promise<PortalSetupResult> {
  const enabled = await confirm({
    message: '\nEnable customer portal? (customers can manage subscriptions and payment methods)',
    default: false
  });

  if (!enabled) {
    return { enabled: false };
  }

  const businessName = await input({
    message: '\nBusiness name shown to customers in the portal',
    validate: (value) => (value.trim().length > 0 ? true : 'Business name is required.')
  });

  const supportEmail = await input({
    message: '\nSupport email (optional, shown in portal)',
    default: '',
    validate: (value) => {
      const trimmed = value.trim();
      if (!trimmed) return true;
      return EMAIL_REGEX.test(trimmed) ? true : 'Please enter a valid email address.';
    }
  });

  return {
    enabled: true,
    businessName: businessName.trim(),
    supportEmail: supportEmail.trim() || undefined
  };
}
