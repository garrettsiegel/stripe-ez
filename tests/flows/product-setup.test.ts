import { beforeEach, describe, expect, it, vi } from 'vitest';

const confirmMock = vi.fn();
const checkboxMock = vi.fn();
const inputMock = vi.fn();
const selectMock = vi.fn();

vi.mock('@inquirer/prompts', () => ({
  confirm: confirmMock,
  checkbox: checkboxMock,
  input: inputMock,
  select: selectMock
}));

describe('product setup flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns usd only when additional currencies are not selected', async () => {
    confirmMock.mockResolvedValue(false);
    const { chooseCurrencies } = await import('../../src/flows/product-setup.js');

    await expect(chooseCurrencies()).resolves.toEqual(['usd']);
  });

  it('includes selected additional currencies and removes duplicate usd', async () => {
    confirmMock.mockResolvedValue(true);
    checkboxMock.mockResolvedValue(['usd', 'eur', 'jpy']);
    const { chooseCurrencies } = await import('../../src/flows/product-setup.js');

    await expect(chooseCurrencies()).resolves.toEqual(['usd', 'eur', 'jpy']);
  });

  it('collects donation product and converts jpy amount', async () => {
    inputMock.mockResolvedValueOnce('Support Project').mockResolvedValueOnce('1.00');
    const { collectProducts } = await import('../../src/flows/product-setup.js');

    const out = await collectProducts('donation', ['usd', 'jpy']);
    expect(out).toEqual([
      {
        name: 'Support Project',
        type: 'donation',
        prices: [
          { amount: 100, currency: 'usd' },
          { amount: 1, currency: 'jpy' }
        ]
      }
    ]);
  });

  it('collects subscription product with trial and tiered metered pricing', async () => {
    inputMock
      .mockResolvedValueOnce('Usage Plan')
      .mockResolvedValueOnce('Metered pricing')
      .mockResolvedValueOnce('10.00')
      .mockResolvedValueOnce('14')
      .mockResolvedValueOnce('2')
      .mockResolvedValueOnce('1000')
      .mockResolvedValueOnce('0.10')
      .mockResolvedValueOnce('0.08');

    confirmMock
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const { collectProducts } = await import('../../src/flows/product-setup.js');
    const out = await collectProducts('subscription', ['usd']);

    expect(out).toHaveLength(1);
    expect(out[0].type).toBe('subscription');
    expect(out[0].prices).toEqual([
      {
        amount: 1000,
        currency: 'usd',
        interval: 'month',
        trialDays: 14,
        usageType: 'metered',
        billingScheme: 'tiered',
        tiers: [
          { upTo: 1000, unitAmount: 10 },
          { upTo: undefined, unitAmount: 8 }
        ]
      }
    ]);
  });

  it('collects one-time product for multiple currencies', async () => {
    inputMock
      .mockResolvedValueOnce('One Time')
      .mockResolvedValueOnce('Simple charge')
      .mockResolvedValueOnce('49.00');
    confirmMock.mockResolvedValueOnce(false);

    const { collectProducts } = await import('../../src/flows/product-setup.js');
    const out = await collectProducts('one_time', ['usd', 'eur']);

    expect(out).toEqual([
      {
        name: 'One Time',
        description: 'Simple charge',
        type: 'one_time',
        prices: [
          { amount: 4900, currency: 'usd' },
          { amount: 4900, currency: 'eur' }
        ]
      }
    ]);
  });

  it('collects product in both-mode and honors selected kind', async () => {
    inputMock
      .mockResolvedValueOnce('Hybrid')
      .mockResolvedValueOnce('Choose one-time')
      .mockResolvedValueOnce('25.00');
    selectMock.mockResolvedValueOnce('one_time');
    confirmMock.mockResolvedValueOnce(false);

    const { collectProducts } = await import('../../src/flows/product-setup.js');
    const out = await collectProducts('both', ['usd']);

    expect(out[0].type).toBe('one_time');
    expect(out[0].prices[0].amount).toBe(2500);
  });

  it('collects subscription product with monthly and yearly prices using licensed per-unit defaults', async () => {
    inputMock
      .mockResolvedValueOnce('Pro')
      .mockResolvedValueOnce('Recurring plan')
      .mockResolvedValueOnce('9.99')
      .mockResolvedValueOnce('99.00');

    confirmMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);

    const { collectProducts } = await import('../../src/flows/product-setup.js');
    const out = await collectProducts('subscription', ['usd']);

    expect(out).toHaveLength(1);
    expect(out[0].prices).toEqual([
      {
        amount: 999,
        currency: 'usd',
        interval: 'month',
        usageType: 'licensed',
        billingScheme: 'per_unit',
        tiers: undefined
      },
      {
        amount: 9900,
        currency: 'usd',
        interval: 'year',
        usageType: 'licensed',
        billingScheme: 'per_unit',
        tiers: undefined
      }
    ]);
  });

  it('collects metered non-tiered subscription when tiered pricing is declined', async () => {
    inputMock
      .mockResolvedValueOnce('Usage Lite')
      .mockResolvedValueOnce('Metered no tiers')
      .mockResolvedValueOnce('5.00');

    confirmMock
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(false);

    const { collectProducts } = await import('../../src/flows/product-setup.js');
    const out = await collectProducts('subscription', ['usd']);

    expect(out[0].prices[0].usageType).toBe('metered');
    expect(out[0].prices[0].billingScheme).toBe('per_unit');
    expect(out[0].prices[0].tiers).toBeUndefined();
  });

  it('applies donation minimum validator rules', async () => {
    inputMock
      .mockResolvedValueOnce('Donations')
      .mockImplementationOnce(async (options: { validate: (v: string) => true | string }) => {
        expect(options.validate('0')).toBe('Minimum amount must be greater than 0');
        expect(options.validate('1')).toBe(true);
        return '2.00';
      });

    const { collectProducts } = await import('../../src/flows/product-setup.js');
    const out = await collectProducts('donation', ['usd']);
    expect(out[0].prices[0].amount).toBe(200);
  });

  it('applies tier and trial validators when collecting subscription details', async () => {
    inputMock
      .mockResolvedValueOnce('Validated Plan')
      .mockResolvedValueOnce('Validation path')
      .mockResolvedValueOnce('15.00')
      .mockResolvedValueOnce('120.00')
      .mockImplementationOnce(async (options: { validate: (v: string) => true | string }) => {
        expect(options.validate('0')).toBe('Enter a positive number of days');
        expect(options.validate('14')).toBe(true);
        return '14';
      })
      .mockImplementationOnce(async (options: { validate: (v: string) => true | string }) => {
        expect(options.validate('0')).toBe('Enter at least 1 tier.');
        expect(options.validate('2')).toBe(true);
        return '2';
      })
      .mockImplementationOnce(async (options: { validate: (v: string) => true | string }) => {
        expect(options.validate('0')).toBe('Enter a positive number.');
        expect(options.validate('1000')).toBe(true);
        return '1000';
      })
      .mockImplementationOnce(async (options: { validate: (v: string) => true | string }) => {
        expect(options.validate('0')).toBe('Enter a value greater than 0.');
        expect(options.validate('0.10')).toBe(true);
        return '0.10';
      })
      .mockImplementationOnce(async (options: { validate: (v: string) => true | string }) => {
        expect(options.validate('0')).toBe('Enter a value greater than 0.');
        expect(options.validate('0.08')).toBe(true);
        return '0.08';
      });

    confirmMock
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const { collectProducts } = await import('../../src/flows/product-setup.js');
    const out = await collectProducts('subscription', ['usd']);

    expect(out[0].prices[0].trialDays).toBe(14);
    expect(out[0].prices[0].tiers).toEqual([
      { upTo: 1000, unitAmount: 10 },
      { upTo: undefined, unitAmount: 8 }
    ]);
  });
});
