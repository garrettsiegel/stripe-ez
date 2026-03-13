import { confirm } from '@inquirer/prompts';
import { removeConfig } from '../config/store.js';

export async function resetCommand(): Promise<void> {
  const ok = await confirm({
    message: '\nRemove local setup file (.stripe-ez.json)? This will not delete anything in Stripe.',
    default: false
  });

  if (!ok) {
    console.log('Canceled.');
    return;
  }

  await removeConfig();
  console.log('Local stripe-ez config removed.');
}
