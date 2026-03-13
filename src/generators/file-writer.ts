import { confirm } from '@inquirer/prompts';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface WriteGeneratedFilesResult {
  written: string[];
  skipped: string[];
}

export async function writeGeneratedFiles(
  files: GeneratedFile[],
  cwd = process.cwd()
): Promise<WriteGeneratedFilesResult> {
  const rootDir = path.resolve(cwd);
  const written: string[] = [];
  const skipped: string[] = [];

  for (const file of files) {
    const fullPath = path.resolve(path.join(cwd, file.path));
    const relativeFromRoot = path.relative(rootDir, fullPath);
    if (relativeFromRoot.startsWith('..') || path.isAbsolute(relativeFromRoot)) {
      throw new Error(`Refusing to write outside project directory: ${file.path}`);
    }
    let exists = false;

    try {
      await fs.access(fullPath);
      exists = true;
    } catch {
      exists = false;
    }

    if (exists) {
      const shouldOverwrite = await confirm({
        message: `\n${file.path} already exists. Overwrite?`,
        default: false
      });

      if (!shouldOverwrite) {
        skipped.push(file.path);
        continue;
      }
    }

    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, file.content, 'utf8');
    written.push(file.path);
  }

  return { written, skipped };
}
