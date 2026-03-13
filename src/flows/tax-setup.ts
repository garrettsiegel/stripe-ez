import { confirm, select } from '@inquirer/prompts';

export interface TaxSetupResult {
  enabled: boolean;
  behavior?: 'automatic' | 'required' | 'unset';
}

export async function setupTaxPrompt(): Promise<TaxSetupResult> {
  const enabled = await confirm({
    message: '\nSet up Stripe tax options?',
    default: false
  });

  if (!enabled) {
    return { enabled: false };
  }

  const behavior = await select<'automatic' | 'required' | 'unset'>({
    message: '\nHow should Stripe handle tax?',
    choices: [
      { name: 'Automatic tax calculation (recommended)', value: 'automatic' },
      { name: 'Require customer tax information', value: 'required' },
      { name: 'Skip for now', value: 'unset' }
    ],
    default: 'automatic'
  });

  return {
    enabled: true,
    behavior
  };
}
