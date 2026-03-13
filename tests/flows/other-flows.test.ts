import { beforeEach, describe, expect, it, vi } from 'vitest';

const confirmMock = vi.fn();
const inputMock = vi.fn();
const selectMock = vi.fn();

vi.mock('@inquirer/prompts', () => ({
  confirm: confirmMock,
  input: inputMock,
  select: selectMock
}));

describe('other flow prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns selected checkout type', async () => {
    selectMock.mockResolvedValue('payment_links');
    const { chooseCheckoutType } = await import('../../src/flows/checkout-setup.js');

    await expect(chooseCheckoutType()).resolves.toBe('payment_links');
  });

  it('returns disabled portal setup when not enabled', async () => {
    confirmMock.mockResolvedValue(false);
    const { setupPortalPrompt } = await import('../../src/flows/portal-setup.js');

    await expect(setupPortalPrompt()).resolves.toEqual({ enabled: false });
  });

  it('returns trimmed portal values when enabled', async () => {
    confirmMock.mockResolvedValue(true);
    inputMock
      .mockResolvedValueOnce('  Acme Inc  ')
      .mockImplementationOnce(async (options: { validate: (value: string) => true | string }) => {
        expect(options.validate('')).toBe(true);
        expect(options.validate('not-an-email')).toBe('Please enter a valid email address.');
        expect(options.validate('support@acme.test')).toBe(true);
        return ' support@acme.test  ';
      });
    const { setupPortalPrompt } = await import('../../src/flows/portal-setup.js');

    await expect(setupPortalPrompt()).resolves.toEqual({
      enabled: true,
      businessName: 'Acme Inc',
      supportEmail: 'support@acme.test'
    });
  });

  it('returns disabled tax setup when not enabled', async () => {
    confirmMock.mockResolvedValue(false);
    const { setupTaxPrompt } = await import('../../src/flows/tax-setup.js');
    await expect(setupTaxPrompt()).resolves.toEqual({ enabled: false });
  });

  it('returns selected tax behavior when enabled', async () => {
    confirmMock.mockResolvedValue(true);
    selectMock.mockResolvedValue('required');
    const { setupTaxPrompt } = await import('../../src/flows/tax-setup.js');

    await expect(setupTaxPrompt()).resolves.toEqual({ enabled: true, behavior: 'required' });
  });

  it('returns selected use case', async () => {
    selectMock.mockResolvedValue('donation');
    const { chooseUseCase } = await import('../../src/flows/product-setup.js');
    await expect(chooseUseCase()).resolves.toBe('donation');
  });
});
