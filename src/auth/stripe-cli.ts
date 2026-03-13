import { confirm } from '@inquirer/prompts';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface StripeCliCredentials {
  secretKey: string;
  publishableKey?: string;
  mode: 'test' | 'live';
  cliVersion?: string;
}

interface CommandResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command: string, args: string[], inheritStdio = false): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: inheritStdio ? 'inherit' : ['ignore', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    if (!inheritStdio) {
      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString('utf8');
      });
      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString('utf8');
      });
    }

    child.on('error', (error) => {
      resolve({ code: null, stdout, stderr: error.message });
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

export async function isStripeCliInstalled(): Promise<boolean> {
  const result = await runCommand('stripe', ['--version']);
  return result.code === 0;
}

export async function getStripeCliVersion(): Promise<string | undefined> {
  const result = await runCommand('stripe', ['--version']);
  if (result.code !== 0) return undefined;
  return result.stdout.trim() || undefined;
}

async function hasBrewInstalled(): Promise<boolean> {
  const result = await runCommand('brew', ['--version']);
  return result.code === 0;
}

export async function ensureStripeCliInstalled(): Promise<void> {
  if (await isStripeCliInstalled()) return;

  if (process.platform !== 'darwin') {
    throw new Error('Stripe CLI is not installed. Install it from https://docs.stripe.com/stripe-cli and run `stripe login`.');
  }

  if (!(await hasBrewInstalled())) {
    throw new Error('Stripe CLI is not installed and Homebrew is unavailable. Install Homebrew first, then run `brew install stripe/stripe-cli/stripe`.');
  }

  const shouldInstall = await confirm({
    message: '\nStripe CLI is not installed. Install it now with Homebrew? (recommended)',
    default: true
  });

  if (!shouldInstall) {
    throw new Error('Stripe CLI is required for the recommended login flow.');
  }

  const install = await runCommand('brew', ['install', 'stripe/stripe-cli/stripe'], true);
  if (install.code !== 0) {
    throw new Error('Failed to install Stripe CLI. Please run `brew install stripe/stripe-cli/stripe` and retry.');
  }
}

export async function runStripeCliLogin(): Promise<void> {
  const login = await runCommand('stripe', ['login'], true);
  if (login.code !== 0) {
    throw new Error('Stripe CLI login was not completed. Please run `stripe login` and try again.');
  }
}

function getStripeCliConfigCandidates(): string[] {
  const home = os.homedir();
  return [path.join(home, '.config', 'stripe', 'config.toml'), path.join(home, '.stripe', 'config.toml')];
}

async function findStripeCliConfigPath(): Promise<string | undefined> {
  for (const configPath of getStripeCliConfigCandidates()) {
    try {
      await fs.access(configPath);
      return configPath;
    } catch {
      // Continue to the next candidate path.
    }
  }
  return undefined;
}

function getTomlString(content: string, key: string): string | undefined {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = content.match(new RegExp(`^\\s*${escapedKey}\\s*=\\s*(['"])(.*?)\\1`, 'm'));
  return match?.[2];
}

export async function readStripeCliCredentials(preferMode: 'test' | 'live' = 'test'): Promise<StripeCliCredentials | undefined> {
  const configPath = await findStripeCliConfigPath();
  if (!configPath) return undefined;

  const content = await fs.readFile(configPath, 'utf8');
  const testSecret = getTomlString(content, 'test_mode_api_key');
  const liveSecret = getTomlString(content, 'live_mode_api_key');
  const testPublishable =
    getTomlString(content, 'test_mode_publishable_key') ?? getTomlString(content, 'test_mode_pub_key');
  const livePublishable =
    getTomlString(content, 'live_mode_publishable_key') ?? getTomlString(content, 'live_mode_pub_key');

  if (preferMode === 'live' && liveSecret) {
    return {
      secretKey: liveSecret,
      publishableKey: livePublishable,
      mode: 'live'
    };
  }

  if (testSecret) {
    return {
      secretKey: testSecret,
      publishableKey: testPublishable,
      mode: 'test'
    };
  }

  if (liveSecret) {
    return {
      secretKey: liveSecret,
      publishableKey: livePublishable,
      mode: 'live'
    };
  }

  return undefined;
}

export async function ensureStripeCliAuthenticated(preferMode: 'test' | 'live' = 'test'): Promise<StripeCliCredentials> {
  await ensureStripeCliInstalled();

  let credentials = await readStripeCliCredentials(preferMode);
  if (!credentials) {
    const shouldLogin = await confirm({
      message: '\nStripe CLI is installed but not logged in. Run `stripe login` now? (opens browser)',
      default: true
    });

    if (!shouldLogin) {
      throw new Error('Stripe CLI login is required before continuing.');
    }

    await runStripeCliLogin();
    credentials = await readStripeCliCredentials(preferMode);

    for (let attempt = 0; !credentials && attempt < 5; attempt += 1) {
      await sleep(1000);
      credentials = await readStripeCliCredentials(preferMode);
    }
  }

  if (!credentials) {
    throw new Error('Could not find Stripe API keys in Stripe CLI config after login.');
  }

  const cliVersion = await getStripeCliVersion();
  return {
    ...credentials,
    cliVersion
  };
}
