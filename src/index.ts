#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { addProductCommand } from './commands/add-product.js';
import { statusCommand } from './commands/status.js';
import { resetCommand } from './commands/reset.js';

const program = new Command();

program
  .name('stripe-ez')
  .description('Set up Stripe payments in under 5 minutes with a guided CLI')
  .option('--no-banner', 'Skip startup banner output')
  .version('1.0.0');

program.action(() => {
  const globalBanner = program.opts<{ banner?: boolean }>().banner;
  return initCommand({ banner: globalBanner });
});

program
  .command('init')
  .description('Full guided setup flow')
  .option('--no-banner', 'Skip startup banner output')
  .action((options: { banner?: boolean }) => {
    const globalBanner = program.opts<{ banner?: boolean }>().banner;
    const banner = options.banner ?? globalBanner;
    return initCommand({ banner });
  });
program.command('add-product').description('Add another product/price to existing setup').action(addProductCommand);
program
  .command('status')
  .description('Check connection and show current config summary')
  .action(() => statusCommand());
program.command('reset').description('Remove local config (does NOT delete Stripe resources)').action(resetCommand);

program.parseAsync(process.argv);
