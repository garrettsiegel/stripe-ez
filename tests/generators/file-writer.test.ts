import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { confirmMock } = vi.hoisted(() => ({
  confirmMock: vi.fn()
}));

vi.mock('@inquirer/prompts', () => ({
  confirm: confirmMock
}));

import { writeGeneratedFiles } from '../../src/generators/file-writer.js';

describe('writeGeneratedFiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refuses to write paths outside project root', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));

    await expect(
      writeGeneratedFiles(
        [
          {
            path: '../outside.txt',
            content: 'nope'
          }
        ],
        cwd
      )
    ).rejects.toThrow(/outside project directory/i);
  });

  it('writes nested files and returns written list', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));
    const out = await writeGeneratedFiles(
      [
        {
          path: 'src/generated/checkout.ts',
          content: 'export const ok = true;\n'
        }
      ],
      cwd
    );

    expect(out).toEqual({ written: ['src/generated/checkout.ts'], skipped: [] });
    const content = await readFile(path.join(cwd, 'src/generated/checkout.ts'), 'utf8');
    expect(content).toContain('ok = true');
  });

  it('skips overwrite when user declines', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));
    const target = path.join(cwd, 'existing.ts');
    await writeFile(target, 'old', 'utf8');
    confirmMock.mockResolvedValue(false);

    const out = await writeGeneratedFiles([{ path: 'existing.ts', content: 'new' }], cwd);

    expect(out).toEqual({ written: [], skipped: ['existing.ts'] });
    expect(await readFile(target, 'utf8')).toBe('old');
  });

  it('overwrites existing files when user confirms', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'stripe-ez-test-'));
    const target = path.join(cwd, 'existing.ts');
    await writeFile(target, 'old', 'utf8');
    confirmMock.mockResolvedValue(true);

    const out = await writeGeneratedFiles([{ path: 'existing.ts', content: 'new' }], cwd);

    expect(out).toEqual({ written: ['existing.ts'], skipped: [] });
    expect(await readFile(target, 'utf8')).toBe('new');
  });
});
