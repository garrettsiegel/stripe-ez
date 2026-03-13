import chalk from 'chalk';
import { setTimeout as sleep } from 'node:timers/promises';
import { StripeEzConfig } from '../config/schema.js';

const ASCII_BANNER = [
  '  _____ _        _              ______ ______',
  ' / ____| |      (_)            |  ____|___  /',
  '| (___ | |_ _ __ _ _ __   ___  | |__     / / ',
  ' \\___ \\| __| \'__| | \'_ \\ / _ \\ |  __|   / /  ',
  ' ____) | |_| |  | | |_) |  __/ | |____ / /__ ',
  '|_____/ \\__|_|  |_| .__/ \\___| |______/_____|',
  '                  | |                         ',
  '                  |_|                         '
];

export interface BannerOptions {
  enabled?: boolean;
  animate?: boolean;
}

function isBannerSuppressedByEnv(): boolean {
  return process.env.STRIPE_EZ_NO_BANNER === '1';
}

function canAnimateBanner(): boolean {
  return Boolean(process.stdout.isTTY) && process.env.CI !== 'true';
}

export async function showBanner(options?: BannerOptions): Promise<void> {
  if (options?.enabled === false || isBannerSuppressedByEnv()) {
    return;
  }

  const supportsColor = chalk.level > 0;
  const lines = supportsColor
    ? ASCII_BANNER.map((line, index) => (index % 2 === 0 ? chalk.cyan(line) : chalk.blue(line)))
    : ASCII_BANNER;

  const title = supportsColor
    ? chalk.bold('\nstripe-ez | guided Stripe setup\n')
    : '\nstripe-ez | guided Stripe setup\n';

  const shouldAnimate = options?.animate !== false && canAnimateBanner();

  console.log();
  if (shouldAnimate) {
    for (const line of lines) {
      console.log(line);
      await sleep(20);
    }
  } else {
    console.log(lines.join('\n'));
  }
  console.log(title);
}

export function showSummary(config: StripeEzConfig): void {
  console.log(chalk.bold('\nHere is your current stripe-ez setup:\n'));
  console.log(`Account: ${config.accountId}`);
  console.log(`Mode: ${config.mode}`);
  console.log(`Products: ${config.products.length}`);
  console.log(`Checkout: ${config.checkout.type}`);
  console.log(`Webhook: ${config.webhook ? 'configured' : 'not configured'}`);
  console.log(`Portal: ${config.portal ? 'configured' : 'not configured'}`);
  console.log(`Tax: ${config.tax ? config.tax.behavior : 'not configured'}`);
}

export function warn(message: string): void {
  console.log(chalk.yellow(`Warning: ${message}`));
}

export function success(message: string): void {
  console.log(chalk.green(message));
}
