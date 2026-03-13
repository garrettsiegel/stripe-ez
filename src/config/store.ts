import { promises as fs } from 'node:fs';
import path from 'node:path';
import { StripeEzConfig, isStripeEzConfig } from './schema.js';

export const CONFIG_FILE = '.stripe-ez.json';

export function getConfigPath(cwd = process.cwd()): string {
  return path.join(cwd, CONFIG_FILE);
}

export async function readConfig(cwd = process.cwd()): Promise<StripeEzConfig | null> {
  const configPath = getConfigPath(cwd);
  try {
    const raw = await fs.readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!isStripeEzConfig(parsed)) {
      throw new Error('Your .stripe-ez.json config looks corrupted. Run `stripe-ez reset` to start fresh, or fix it manually.');
    }
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function writeConfig(config: StripeEzConfig, cwd = process.cwd()): Promise<void> {
  const configPath = getConfigPath(cwd);
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
}

export async function removeConfig(cwd = process.cwd()): Promise<void> {
  const configPath = getConfigPath(cwd);
  try {
    await fs.unlink(configPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }
}
