import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ensureGitignoreEntries } from '../../src/config/gitignore.js';

describe('ensureGitignoreEntries', () => {
  it('returns missing entries when .gitignore does not exist', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));
    const result = await ensureGitignoreEntries(cwd);

    expect(result.exists).toBe(false);
    expect(result.missing).toEqual(['.stripe-ez.json', '.env']);
  });

  it('appends required entries when missing', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));
    const file = path.join(cwd, '.gitignore');
    await writeFile(file, 'node_modules\n', 'utf8');

    const result = await ensureGitignoreEntries(cwd);
    const next = await readFile(file, 'utf8');

    expect(result.exists).toBe(true);
    expect(result.added).toEqual(['.stripe-ez.json', '.env']);
    expect(next).toContain('.stripe-ez.json');
    expect(next).toContain('.env');
  });

  it('does not rewrite when entries are already present', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));
    const file = path.join(cwd, '.gitignore');
    const initial = 'node_modules\n.stripe-ez.json\n.env\n';
    await writeFile(file, initial, 'utf8');

    const result = await ensureGitignoreEntries(cwd);
    const next = await readFile(file, 'utf8');

    expect(result.added).toEqual([]);
    expect(next).toBe(initial);
  });
});
