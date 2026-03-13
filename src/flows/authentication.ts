import { password, select } from '@inquirer/prompts';
import { ensureStripeCliAuthenticated } from '../auth/stripe-cli.js';
import { validateStripeKey } from '../stripe/client.js';
import { keyHint } from '../utils/validation.js';

export interface AuthResult {
  method: 'api_key' | 'stripe_cli';
  secretKey: string;
  keyHint: string;
  accountId: string;
  mode: 'test' | 'live';
  publishableKey?: string;
  stripeCliVersion?: string;
}

export async function runAuthenticationFlow(): Promise<AuthResult> {
  const targetMode = await select<'test' | 'live'>({
    message: '\nChoose Stripe mode',
    choices: [
      { name: 'Test mode (recommended: safe for development)', value: 'test' },
      { name: 'Live mode (real charges)', value: 'live' }
    ],
    default: 'test'
  });

  const method = await select({
    message: '\nHow do you want to connect to Stripe?',
    choices: [
      { name: 'Use Stripe CLI login (recommended: easiest)', value: 'stripe_cli' },
      { name: 'Paste an API key manually (advanced)', value: 'api_key' }
    ],
    default: 'stripe_cli'
  });

  if (method === 'stripe_cli') {
    const credentials = await ensureStripeCliAuthenticated(targetMode);
    const { accountId } = await validateStripeKey(credentials.secretKey);

    return {
      method: 'stripe_cli',
      secretKey: credentials.secretKey,
      keyHint: keyHint(credentials.secretKey),
      accountId,
      mode: credentials.mode,
      publishableKey: credentials.publishableKey,
      stripeCliVersion: credentials.cliVersion
    };
  }

  const secretKey = await password({
    message: `\nPaste your Stripe secret key (${targetMode === 'live' ? 'example: sk_live_...' : 'example: sk_test_...'})`,
    mask: '*',
    validate: (value) => {
      const looksLikeSecret =
        value.startsWith('sk_test_') ||
        value.startsWith('sk_live_') ||
        value.startsWith('rk_test_') ||
        value.startsWith('rk_live_');

      if (!looksLikeSecret) {
        return 'That does not look like a Stripe key. It should start with sk_ or rk_.';
      }

      if (targetMode === 'test' && (value.startsWith('sk_live_') || value.startsWith('rk_live_'))) {
        return 'You selected Test mode, but entered a Live key. Please paste a Test key.';
      }

      if (targetMode === 'live' && (value.startsWith('sk_test_') || value.startsWith('rk_test_'))) {
        return 'You selected Live mode, but entered a Test key. Please paste a Live key.';
      }

      return true;
    }
  });

  const { accountId } = await validateStripeKey(secretKey);

  return {
    method: 'api_key',
    secretKey,
    keyHint: keyHint(secretKey),
    accountId,
    mode: secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_') ? 'live' : 'test'
  };
}
