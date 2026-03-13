import ora from 'ora';

export async function withSpinner<T>(text: string, work: () => Promise<T>): Promise<T> {
  const spinner = ora(text).start();
  try {
    const result = await work();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}
