import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.fn();
const passwordMock = vi.fn();
const ensureStripeCliAuthenticatedMock = vi.fn();
const validateStripeKeyMock = vi.fn();
const openMock = vi.fn();

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

vi.mock('open', () => ({
  default: openMock
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
    expect(openMock).not.toHaveBeenCalled();
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
    const testPublishable = ['pk', 'test', 'abcdefghijklmn'].join('_');
    selectMock.mockResolvedValueOnce('test').mockResolvedValueOnce('api_key');
    passwordMock.mockResolvedValueOnce(testSecret).mockResolvedValueOnce(testPublishable);
    validateStripeKeyMock.mockResolvedValue({ accountId: 'acct_test_123' });

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');
    const out = await runAuthenticationFlow();

    expect(ensureStripeCliAuthenticatedMock).not.toHaveBeenCalled();
    expect(passwordMock).toHaveBeenCalledTimes(2);
    expect(validateStripeKeyMock).toHaveBeenCalledWith(testSecret);
    expect(out).toEqual({
      method: 'api_key',
      secretKey: testSecret,
      keyHint: 'sk_test...klmn',
      accountId: 'acct_test_123',
      mode: 'test',
      publishableKey: testPublishable
    });
  });

  it('infers live mode from rk_live key in manual api key path', async () => {
    const restrictedLive = ['rk', 'live', 'abcdefghijklmn'].join('_');
    const livePublishable = ['pk', 'live', 'abcdefghijklmn'].join('_');
    selectMock.mockResolvedValueOnce('live').mockResolvedValueOnce('api_key');
    passwordMock.mockResolvedValueOnce(restrictedLive).mockResolvedValueOnce(livePublishable);
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
    const publishableLiveInput = ['pk', 'live', '123'].join('_');
    const acceptedPublishable = ['pk', 'test', 'valid1234'].join('_');
    selectMock.mockResolvedValueOnce('test').mockResolvedValueOnce('api_key');
    passwordMock
      .mockImplementationOnce(async (options: { validate: (value: string) => true | string; message: string; mask: string }) => {
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
      })
      .mockImplementationOnce(async (options: { validate: (value: string) => true | string; message: string }) => {
        expect(options.message).toContain('example: pk_test_...');
        expect(options.validate('not_a_publishable_key')).toBe(
          'That does not look like a Stripe publishable key. It should start with pk_.'
        );
        expect(options.validate(publishableLiveInput)).toBe(
          'You selected Test mode, but entered a Live publishable key. Please paste a Test key.'
        );
        return acceptedPublishable;
      });
    validateStripeKeyMock.mockResolvedValue({ accountId: 'acct_test_val' });

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');
    const out = await runAuthenticationFlow();

    expect(out.secretKey).toBe(acceptedSecret);
    expect(out.mode).toBe('test');
    expect(out.publishableKey).toBe(acceptedPublishable);
  });

  it('configures manual key prompt validator for live mode mismatch rule', async () => {
    const mismatchedTest = ['sk', 'test', '123'].join('_');
    const acceptedLive = ['sk', 'live', 'valid1234'].join('_');
    const publishableMismatchedTest = ['pk', 'test', '123'].join('_');
    const acceptedLivePublishable = ['pk', 'live', 'valid1234'].join('_');
    selectMock.mockResolvedValueOnce('live').mockResolvedValueOnce('api_key');
    passwordMock
      .mockImplementationOnce(async (options: { validate: (value: string) => true | string; message: string }) => {
        expect(options.message).toContain('example: sk_live_...');
        expect(options.validate(mismatchedTest)).toBe(
          'You selected Live mode, but entered a Test key. Please paste a Live key.'
        );
        return acceptedLive;
      })
      .mockImplementationOnce(async (options: { validate: (value: string) => true | string; message: string }) => {
        expect(options.message).toContain('example: pk_live_...');
        expect(options.validate(publishableMismatchedTest)).toBe(
          'You selected Live mode, but entered a Test publishable key. Please paste a Live key.'
        );
        return acceptedLivePublishable;
      });
    validateStripeKeyMock.mockResolvedValue({ accountId: 'acct_live_val' });

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');
    const out = await runAuthenticationFlow();

    expect(out.mode).toBe('live');
    expect(out.secretKey).toBe(acceptedLive);
    expect(out.publishableKey).toBe(acceptedLivePublishable);
  });

  it('bubbles stripe cli helper failure and does not retry in this flow', async () => {
    selectMock.mockResolvedValueOnce('test').mockResolvedValueOnce('stripe_cli');
    ensureStripeCliAuthenticatedMock.mockRejectedValue(new Error('cli auth failed after retries'));

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');

    await expect(runAuthenticationFlow()).rejects.toThrow('cli auth failed after retries');
    expect(ensureStripeCliAuthenticatedMock).toHaveBeenCalledTimes(1);
    expect(validateStripeKeyMock).not.toHaveBeenCalled();
    expect(openMock).not.toHaveBeenCalled();
  });

  it('falls back to manual key paste when live mode + stripe cli fails', async () => {
    const liveSecret = ['sk', 'live', 'fallback1234'].join('_');
    const livePublishable = ['pk', 'live', 'fallback1234'].join('_');
    selectMock.mockResolvedValueOnce('live').mockResolvedValueOnce('stripe_cli');
    ensureStripeCliAuthenticatedMock.mockRejectedValue(
      new Error('Stripe CLI only has test-mode keys.')
    );
    passwordMock.mockResolvedValueOnce(liveSecret).mockResolvedValueOnce(livePublishable);
    validateStripeKeyMock.mockResolvedValue({ accountId: 'acct_live_fb' });

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');
    const out = await runAuthenticationFlow();

    expect(ensureStripeCliAuthenticatedMock).toHaveBeenCalledWith('live');
    expect(openMock).toHaveBeenCalledWith('https://dashboard.stripe.com/apikeys');
    expect(passwordMock).toHaveBeenCalledTimes(2);
    expect(out).toEqual({
      method: 'api_key',
      secretKey: liveSecret,
      keyHint: 'sk_live...1234',
      accountId: 'acct_live_fb',
      mode: 'live',
      publishableKey: livePublishable
    });
  });

  it('bubbles validateStripeKey failure for manual path', async () => {
    const badTestKey = ['sk', 'test', 'bad'].join('_');
    const testPublishable = ['pk', 'test', 'bad'].join('_');
    selectMock.mockResolvedValueOnce('test').mockResolvedValueOnce('api_key');
    passwordMock.mockResolvedValueOnce(badTestKey).mockResolvedValueOnce(testPublishable);
    validateStripeKeyMock.mockRejectedValue(new Error('invalid api key'));

    const { runAuthenticationFlow } = await import('../../src/flows/authentication.js');

    await expect(runAuthenticationFlow()).rejects.toThrow('invalid api key');
    expect(validateStripeKeyMock).toHaveBeenCalledWith(badTestKey);
  });
});
