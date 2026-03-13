import { input } from '@inquirer/prompts';

export async function promptNonEmpty(message: string): Promise<string> {
  return input({
    message,
    validate: (value) => (value.trim().length > 0 ? true : 'This value is required.')
  });
}
