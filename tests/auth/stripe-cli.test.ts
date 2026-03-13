import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const confirmMock = vi.fn();
const statMock = vi.fn();
const readFileMock = vi.fn();
const homedirMock = vi.fn(() => '/mock-home');
const spawnMock = vi.fn();
const testSecret = ['sk', 'test', 'example'].join('_');
const liveSecret = ['sk', 'live', 'example'].join('_');
const livePublishable = ['pk', 'live', 'example'].join('_');

vi.mock('@inquirer/prompts', () => ({
  confirm: confirmMock
}));

vi.mock('node:fs', () => ({
  promises: {
    stat: statMock,
    readFile: readFileMock
  }
}));

vi.mock('node:os', () => ({
  default: {
    homedir: homedirMock
  }
}));

vi.mock('node:child_process', () => ({
  spawn: spawnMock
}));

type QueuedCommandResult = {
  code: number | null;
  stdout?: string;
  stderr?: string;
  error?: Error;
};

function queueCommandResults(...results: QueuedCommandResult[]) {
  const pending = [...results];

  spawnMock.mockImplementation((_command: string, _args: string[], options: { stdio?: string | string[] }) => {
    const next = pending.shift();
    if (!next) {
      throw new Error('No queued command result available.');
    }

    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();

    queueMicrotask(() => {
      if (next.error) {
        child.emit('error', next.error);
        return;
      }

      if (options.stdio !== 'inherit') {
        if (next.stdout) child.stdout.emit('data', Buffer.from(next.stdout));
        if (next.stderr) child.stderr.emit('data', Buffer.from(next.stderr));
      }

      child.emit('close', next.code);
    });

    return child;
  });
}

describe('stripe-cli auth helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    statMock.mockResolvedValue({ mode: 0o600 });
  });

  it('returns live credentials when live mode is preferred and live keys are present', async () => {
    readFileMock.mockResolvedValue([
      `test_mode_api_key = "${testSecret}"`,
      `live_mode_api_key = "${liveSecret}"`,
      `live_mode_publishable_key = "${livePublishable}"`
    ].join('\n'));

    const { readStripeCliCredentials } = await import('../../src/auth/stripe-cli.js');

    await expect(readStripeCliCredentials('live')).resolves.toEqual({
      secretKey: liveSecret,
      publishableKey: livePublishable,
      mode: 'live'
    });
  });

  it('does not fall back to test credentials when live mode is preferred but live keys are missing', async () => {
    readFileMock.mockResolvedValue(`test_mode_api_key = "${testSecret}"\n`);

    const { readStripeCliCredentials } = await import('../../src/auth/stripe-cli.js');

    await expect(readStripeCliCredentials('live')).resolves.toBeUndefined();
  });

  it('preserves test-mode behavior by returning test credentials first and live credentials as a fallback', async () => {
    readFileMock.mockResolvedValue(`live_mode_api_key = "${liveSecret}"\n`);

    const { readStripeCliCredentials } = await import('../../src/auth/stripe-cli.js');

    await expect(readStripeCliCredentials('test')).resolves.toEqual({
      secretKey: liveSecret,
      publishableKey: undefined,
      mode: 'live'
    });
  });

  it('surfaces an actionable error when live mode is requested but Stripe CLI only has test credentials', async () => {
    queueCommandResults({ code: 0, stdout: 'stripe version 1.24.0' });
    readFileMock.mockResolvedValue(`test_mode_api_key = "${testSecret}"\n`);

    const { ensureStripeCliAuthenticated } = await import('../../src/auth/stripe-cli.js');

    await expect(ensureStripeCliAuthenticated('live')).rejects.toThrow(
      'Stripe CLI only has test-mode keys. Log in with live credentials or paste live API keys manually.'
    );
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('finds live keys under a [default] TOML section', async () => {
    readFileMock.mockResolvedValue(
      `[default]\ntest_mode_api_key = "${testSecret}"\nlive_mode_api_key = "${liveSecret}"\nlive_mode_publishable_key = "${livePublishable}"\n`
    );

    const { readStripeCliCredentials } = await import('../../src/auth/stripe-cli.js');

    await expect(readStripeCliCredentials('live')).resolves.toEqual({
      secretKey: liveSecret,
      publishableKey: livePublishable,
      mode: 'live'
    });
  });

  it('finds test keys under a [default] TOML section', async () => {
    readFileMock.mockResolvedValue(
      `[default]\ntest_mode_api_key = "${testSecret}"\n`
    );

    const { readStripeCliCredentials } = await import('../../src/auth/stripe-cli.js');

    await expect(readStripeCliCredentials('test')).resolves.toEqual({
      secretKey: testSecret,
      publishableKey: undefined,
      mode: 'test'
    });
  });

  it('finds keys under nested [profiles.default] TOML section', async () => {
    readFileMock.mockResolvedValue(
      `[profiles.default]\ntest_mode_api_key = "${testSecret}"\nlive_mode_api_key = "${liveSecret}"\nlive_mode_publishable_key = "${livePublishable}"\n`
    );

    const { readStripeCliCredentials } = await import('../../src/auth/stripe-cli.js');

    await expect(readStripeCliCredentials('live')).resolves.toEqual({
      secretKey: liveSecret,
      publishableKey: livePublishable,
      mode: 'live'
    });
  });
});