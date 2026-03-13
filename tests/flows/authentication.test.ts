import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();
const passwordMock = vi.fn();
const ensureStripeCliAuthenticatedMock = vi.fn();
const validateStripeKeyMock = vi.fn();

vi.mock('@inquirer/prompts', () => ({
  select: selectMock,
  password: passwordMock
}));

vi.mock('../../src/auth/stripe-cli.js', () => ({
  ensureStripeCliAuthenticated: ensureStripeCliAuthenticatedMock
}));

vi.mock('../../src/stripe/client.js', () => ({
  validateStripeKey: validateStripeKeyMock
}));

describe('runAuthenticationFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses stripe cli path, validates returned key, and returns enriched auth result', async () => {
    const cliSecret = ['sk', 'live', 'cli', '1234'].join('_');
    selectMock.mockResolvedValueOnce('live').mockResolvedValueOnce('stripe_cli');
    ensureStripeCliAuthenticatedMock.mockResolvedValue({
      secretKey: cliSecret,
      publishableKey: ['pk', 'live', '1234'].join('_'),
      mode: 'live',
      cliVersion: 'stripe version 1.20.0'
    });
    validateStripeKeyMock.mockResolvedValue({ accountId: 'acct_live_123' });

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');
    const out = await runAuthenticationFlow();

    expect(selectMock).toHaveBeenCalledTimes(2);
    expect(passwordMock).not.toHaveBeenCalled();
    expect(ensureStripeCliAuthenticatedMock).toHaveBeenCalledTimes(1);
    expect(ensureStripeCliAuthenticatedMock).toHaveBeenCalledWith('live');
    expect(validateStripeKeyMock).toHaveBeenCalledWith(cliSecret);

    expect(out).toEqual({
      method: 'stripe_cli',
      secretKey: cliSecret,
      keyHint: 'sk_live...1234',
      accountId: 'acct_live_123',
      mode: 'live',
      publishableKey: ['pk', 'live', '1234'].join('_'),
      stripeCliVersion: 'stripe version 1.20.0'
    });
  });

  it('uses manual api key path in test mode and infers test mode from sk_test key', async () => {
    const testSecret = ['sk', 'test', 'abcdefghijklmn'].join('_');
    selectMock.mockResolvedValueOnce('test').mockResolvedValueOnce('api_key');
    passwordMock.mockResolvedValue(testSecret);
    validateStripeKeyMock.mockResolvedValue({ accountId: 'acct_test_123' });

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');
    const out = await runAuthenticationFlow();

    expect(ensureStripeCliAuthenticatedMock).not.toHaveBeenCalled();
    expect(passwordMock).toHaveBeenCalledTimes(1);
    expect(validateStripeKeyMock).toHaveBeenCalledWith(testSecret);
    expect(out).toEqual({
      method: 'api_key',
      secretKey: testSecret,
      keyHint: 'sk_test...klmn',
      accountId: 'acct_test_123',
      mode: 'test'
    });
  });

  it('infers live mode from rk_live key in manual api key path', async () => {
    const restrictedLive = ['rk', 'live', 'abcdefghijklmn'].join('_');
    selectMock.mockResolvedValueOnce('live').mockResolvedValueOnce('api_key');
    passwordMock.mockResolvedValue(restrictedLive);
    validateStripeKeyMock.mockResolvedValue({ accountId: 'acct_live_987' });

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');
    const out = await runAuthenticationFlow();

    expect(out.mode).toBe('live');
    expect(out.method).toBe('api_key');
    expect(out.keyHint).toBe('rk_live...klmn');
  });

  it('configures manual key prompt validator for test mode rules', async () => {
    const liveInput = ['sk', 'live', '123'].join('_');
    const validRestrictedTest = ['rk', 'test', '123'].join('_');
    const acceptedSecret = ['rk', 'test', 'valid1234'].join('_');
    selectMock.mockResolvedValueOnce('test').mockResolvedValueOnce('api_key');
    passwordMock.mockImplementation(async (options: { validate: (value: string) => true | string }) => {
      expect(options.message).toContain('example: sk_test_...');
      expect(options.mask).toBe('*');
      expect(options.validate('not_a_key')).toBe(
        'That does not look like a Stripe key. It should start with sk_ or rk_.'
      );
      expect(options.validate(liveInput)).toBe(
        'You selected Test mode, but entered a Live key. Please paste a Test key.'
      );
      expect(options.validate(validRestrictedTest)).toBe(true);
      return acceptedSecret;
    });
    validateStripeKeyMock.mockResolvedValue({ accountId: 'acct_test_val' });

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');
    const out = await runAuthenticationFlow();

    expect(out.secretKey).toBe(acceptedSecret);
    expect(out.mode).toBe('test');
  });

  it('configures manual key prompt validator for live mode mismatch rule', async () => {
    const mismatchedTest = ['sk', 'test', '123'].join('_');
    const acceptedLive = ['sk', 'live', 'valid1234'].join('_');
    selectMock.mockResolvedValueOnce('live').mockResolvedValueOnce('api_key');
    passwordMock.mockImplementation(async (options: { validate: (value: string) => true | string }) => {
      expect(options.message).toContain('example: sk_live_...');
      expect(options.validate(mismatchedTest)).toBe(
        'You selected Live mode, but entered a Test key. Please paste a Live key.'
      );
      return acceptedLive;
    });
    validateStripeKeyMock.mockResolvedValue({ accountId: 'acct_live_val' });

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');
    const out = await runAuthenticationFlow();

    expect(out.mode).toBe('live');
    expect(out.secretKey).toBe(acceptedLive);
  });

  it('bubbles stripe cli helper failure and does not retry in this flow', async () => {
    selectMock.mockResolvedValueOnce('test').mockResolvedValueOnce('stripe_cli');
    ensureStripeCliAuthenticatedMock.mockRejectedValue(new Error('cli auth failed after retries'));

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');

    await expect(runAuthenticationFlow()).rejects.toThrow('cli auth failed after retries');
    expect(ensureStripeCliAuthenticatedMock).toHaveBeenCalledTimes(1);
    expect(validateStripeKeyMock).not.toHaveBeenCalled();
  });

  it('bubbles validateStripeKey failure for manual path', async () => {
    const badTestKey = ['sk', 'test', 'bad'].join('_');
    selectMock.mockResolvedValueOnce('test').mockResolvedValueOnce('api_key');
    passwordMock.mockResolvedValue(badTestKey);
    validateStripeKeyMock.mockRejectedValue(new Error('invalid api key'));

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');

    await expect(runAuthenticationFlow()).rejects.toThrow('invalid api key');
    expect(validateStripeKeyMock).toHaveBeenCalledWith(badTestKey);
  });
});
