import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONFIG_FILE, getConfigPath, readConfig, removeConfig, writeConfig } from '../../src/config/store.js';
import { StripeEzConfig } from '../../src/config/schema.js';

function makeConfig(): StripeEzConfig {
  return {
    version: '1.0.0',
    accountId: 'acct_123',
    mode: 'test',
    createdAt: '2026-01-01T00:00:00.000Z',
    auth: { method: 'api_key', keyHint: 'sk_test...1234' },
    products: [],
    checkout: { type: 'hosted' }
  };
}

describe('config store', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds config path from cwd', () => {
    expect(getConfigPath('/tmp/work')).toBe(path.join('/tmp/work', CONFIG_FILE));
  });

  it('returns null when config file does not exist', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));
    await expect(readConfig(cwd)).resolves.toBeNull();
  });

  it('writes and reads config successfully', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));
    const config = makeConfig();

    await writeConfig(config, cwd);
    const loaded = await readConfig(cwd);

    expect(loaded).toEqual(config);
  });

  it('throws when config json is invalid', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));
    await writeFile(path.join(cwd, CONFIG_FILE), '{not-json', 'utf8');

    await expect(readConfig(cwd)).rejects.toThrow();
  });

  it('throws when config shape is invalid', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));
    await writeFile(path.join(cwd, CONFIG_FILE), JSON.stringify({ nope: true }), 'utf8');

    await expect(readConfig(cwd)).rejects.toThrow(/config looks corrupted/i);
  });

  it('removes config and ignores ENOENT', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));
    const config = makeConfig();

    await writeConfig(config, cwd);
    await removeConfig(cwd);
    await expect(readFile(path.join(cwd, CONFIG_FILE), 'utf8')).rejects.toThrow();

    await expect(removeConfig(cwd)).resolves.toBeUndefined();
  });
});
