import { promises as fs } from 'node:fs';
import path from 'node:path';

const REQUIRED_ENTRIES = ['.stripe-ez.json', '.env'];

export interface GitignoreResult {
  exists: boolean;
  added: string[];
  missing: string[];
}

export async function ensureGitignoreEntries(cwd = process.cwd()): Promise<GitignoreResult> {
  const gitignorePath = path.join(cwd, '.gitignore');

  try {
    const raw = await fs.readFile(gitignorePath, 'utf8');
    const lines = raw.split(/\r?\n/).map((line) => line.trim());

    const added: string[] = [];
    for (const entry of REQUIRED_ENTRIES) {
      if (!lines.includes(entry)) {
        added.push(entry);
      }
    }

    if (added.length > 0) {
      const next = `${raw.trimEnd()}\n${added.join('\n')}\n`;
      await fs.writeFile(gitignorePath, next, 'utf8');
    }

    return { exists: true, added, missing: [] };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { exists: false, added: [], missing: REQUIRED_ENTRIES };
    }
    throw error;
  }
}
