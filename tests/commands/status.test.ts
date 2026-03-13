import { beforeEach, describe, expect, it, vi } from 'vitest';

const readConfigMock = vi.fn();
const createStripeClientMock = vi.fn();
const showSummaryMock = vi.fn();
const successMock = vi.fn();
const warnMock = vi.fn();

vi.mock('../../src/config/store.js', () => ({
  readConfig: readConfigMock
}));

vi.mock('../../src/stripe/client.js', () => ({
  createStripeClient: createStripeClientMock
}));

vi.mock('../../src/ui/display.js', () => ({
  showSummary: showSummaryMock,
  success: successMock,
  warn: warnMock
}));

describe('statusCommand', () => {
  const originalEnv = process.env.STRIPE_SECRET_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = originalEnv;
  });

  it('warns when config does not exist', async () => {
    readConfigMock.mockResolvedValue(null);
    const { statusCommand } = await import('../../src/commands/status.js');

    await statusCommand();
    expect(warnMock).toHaveBeenCalledWith('No .stripe-ez.json found. Run `stripe-ez init` first.');
    expect(showSummaryMock).not.toHaveBeenCalled();
  });

  it('warns when secret key is missing', async () => {
    readConfigMock.mockResolvedValue({ products: [], checkout: { type: 'hosted' } });
    delete process.env.STRIPE_SECRET_KEY;
    const { statusCommand } = await import('../../src/commands/status.js');

    await statusCommand();
    expect(showSummaryMock).toHaveBeenCalledTimes(1);
    expect(warnMock).toHaveBeenCalledWith('No secret key provided for connectivity check. Set STRIPE_SECRET_KEY.');
  });

  it('checks stripe connectivity when key is provided', async () => {
    const retrieve = vi.fn().mockResolvedValue({ id: 'acct_123' });
    readConfigMock.mockResolvedValue({ products: [], checkout: { type: 'hosted' } });
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    createStripeClientMock.mockReturnValue({ accounts: { retrieve } });

    const { statusCommand } = await import('../../src/commands/status.js');
    await statusCommand();

    expect(createStripeClientMock).toHaveBeenCalledWith('sk_test_123');
    expect(retrieve).toHaveBeenCalledTimes(1);
    expect(successMock).toHaveBeenCalledWith('\nConnection check passed.');
  });
});
