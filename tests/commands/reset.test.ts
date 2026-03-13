import { beforeEach, describe, expect, it, vi } from 'vitest';

const confirmMock = vi.fn();
const removeConfigMock = vi.fn();

vi.mock('@inquirer/prompts', () => ({
  confirm: confirmMock
}));

vi.mock('../../src/config/store.js', () => ({
  removeConfig: removeConfigMock
}));

describe('resetCommand', () => {
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prints canceled and exits when user declines', async () => {
    confirmMock.mockResolvedValue(false);
    const { resetCommand } = await import('../../src/commands/reset.js');

    await resetCommand();
    expect(removeConfigMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith('Canceled.');
  });

  it('removes config when user confirms', async () => {
    confirmMock.mockResolvedValue(true);
    const { resetCommand } = await import('../../src/commands/reset.js');

    await resetCommand();
    expect(removeConfigMock).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith('Local stripe-ez config removed.');
  });
});
