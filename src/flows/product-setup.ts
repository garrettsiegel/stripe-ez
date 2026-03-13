import { checkbox, confirm, input, select } from '@inquirer/prompts';
import { parseUsdToCents, validateProductName } from '../utils/validation.js';
import { ProductCreateInput } from '../stripe/products.js';

export type SetupUseCase = 'one_time' | 'subscription' | 'both' | 'donation';

export async function chooseUseCase(): Promise<SetupUseCase> {
  return select({
    message: '\nWhat do you want to sell?',
    choices: [
      { name: 'One-time payments (buy once)', value: 'one_time' },
      { name: 'Subscriptions (monthly or yearly)', value: 'subscription' },
      { name: 'Both one-time and subscription options', value: 'both' },
      { name: 'Donations / pay-what-you-want', value: 'donation' }
    ]
  });
}

export async function chooseCurrencies(): Promise<string[]> {
  const includeMore = await confirm({
    message: '\nDo you want to accept currencies besides USD?',
    default: false
  });

  if (!includeMore) {
    return ['usd'];
  }

  const selections = await checkbox({
    message: '\nChoose additional currencies (USD is always included)',
    choices: [
      { name: 'EUR', value: 'eur' },
      { name: 'GBP', value: 'gbp' },
      { name: 'CAD', value: 'cad' },
      { name: 'AUD', value: 'aud' },
      { name: 'JPY', value: 'jpy' }
    ]
  });

  return ['usd', ...selections.filter((value) => value !== 'usd')];
}

function toAmount(input: string, currency: string): number {
  const cents = parseUsdToCents(input);
  if (currency === 'jpy') {
    return Math.max(1, Math.round(cents / 100));
  }
  return cents;
}

async function collectSubscriptionPricingOptions(): Promise<{
  usageType?: 'metered' | 'licensed';
  billingScheme?: 'per_unit' | 'tiered';
  tiers?: Array<{ upTo?: number; flatAmount?: number; unitAmount?: number }>;
}> {
  const isMetered = await confirm({
    message: '\nUse usage-based billing (metered)?',
    default: false
  });

  if (!isMetered) {
    return { usageType: 'licensed', billingScheme: 'per_unit' };
  }

  const isTiered = await confirm({
    message: '\nUse pricing tiers for usage?',
    default: false
  });

  if (!isTiered) {
    return { usageType: 'metered', billingScheme: 'per_unit' };
  }

  const tierCountInput = await input({
    message: '\nHow many pricing tiers do you want?',
    default: '2',
    validate: (v) => {
      const parsed = Number.parseInt(v, 10);
      return parsed > 0 ? true : 'Enter at least 1 tier.';
    }
  });

  const tierCount = Number.parseInt(tierCountInput, 10);
  const tiers: Array<{ upTo?: number; flatAmount?: number; unitAmount?: number }> = [];

  for (let i = 0; i < tierCount; i += 1) {
    const isLastTier = i === tierCount - 1;
    const upToInput = isLastTier
      ? ''
      : await input({
          message: `Tier ${i + 1}: units up to`,
          validate: (v) => {
            const parsed = Number.parseInt(v, 10);
            return parsed > 0 ? true : 'Enter a positive number.';
          }
        });

    const unitAmountInput = await input({
      message: `Tier ${i + 1}: price per unit in USD`,
      default: '0.10',
      validate: (v) => (Number.parseFloat(v) > 0 ? true : 'Enter a value greater than 0.')
    });

    tiers.push({
      upTo: upToInput ? Number.parseInt(upToInput, 10) : undefined,
      unitAmount: parseUsdToCents(unitAmountInput)
    });
  }

  return { usageType: 'metered', billingScheme: 'tiered', tiers };
}

export async function collectProducts(useCase: SetupUseCase, currencies: string[]): Promise<ProductCreateInput[]> {
  const products: ProductCreateInput[] = [];

  if (useCase === 'donation') {
    const name = await input({ message: '\nCause or product name', validate: validateProductName });
    const min = await input({
      message: '\nMinimum amount in USD (example: 1.00)',
      default: '1',
      validate: (v) => (Number.parseFloat(v) > 0 ? true : 'Minimum amount must be greater than 0')
    });
    products.push({
      name,
      type: 'donation',
      prices: currencies.map((currency) => ({ amount: toAmount(min, currency), currency }))
    });
    return products;
  }

  let addMore = true;
  while (addMore) {
    const name = await input({ message: '\nProduct name', validate: validateProductName });
    const description = await input({ message: '\nDescription (optional, shown in Stripe)' });

    const kind =
      useCase === 'both'
        ? await select({
            message: 'For this product, is billing one-time or subscription?',
            choices: [
              { name: 'One-time (single charge)', value: 'one_time' },
              { name: 'Subscription (recurring charge)', value: 'subscription' }
            ]
          })
        : useCase;

    if (kind === 'one_time') {
      const amountInput = await input({ message: '\nPrice in USD (example: 49.00)' });
      products.push({
        name,
        description: description || undefined,
        type: 'one_time',
        prices: currencies.map((currency) => ({ amount: toAmount(amountInput, currency), currency }))
      });
    } else {
      const monthlyInput = await input({ message: '\nMonthly price in USD (example: 9.99)' });
      const yearlyEnabled = await confirm({ message: '\nAlso add a yearly price?', default: true });
      const prices: ProductCreateInput['prices'] = currencies.map((currency) => ({
        amount: toAmount(monthlyInput, currency),
        currency,
        interval: 'month'
      }));
      if (yearlyEnabled) {
        const yearlyInput = await input({ message: '\nYearly price in USD (example: 99.00)' });
        prices.push(
          ...currencies.map((currency) => ({
            amount: toAmount(yearlyInput, currency),
            currency,
            interval: 'year' as const
          }))
        );
      }
      const hasTrial = await confirm({ message: '\nOffer a free trial?', default: false });
      if (hasTrial) {
        const trialDaysInput = await input({
          message: '\nFree trial length in days',
          default: '14',
          validate: (v) => (Number.parseInt(v, 10) > 0 ? true : 'Enter a positive number of days')
        });
        const trialDays = Number.parseInt(trialDaysInput, 10);
        for (const price of prices) {
          price.trialDays = trialDays;
        }
      }

      const pricingOptions = await collectSubscriptionPricingOptions();
      if (pricingOptions.usageType || pricingOptions.billingScheme) {
        for (const price of prices) {
          price.usageType = pricingOptions.usageType;
          price.billingScheme = pricingOptions.billingScheme;
          price.tiers = pricingOptions.tiers;
        }
      }

      products.push({
        name,
        description: description || undefined,
        type: 'subscription',
        prices
      });
    }

    addMore = await confirm({ message: '\nAdd another product?', default: false });
  }

  if (products.length === 0) {
    throw new Error("You haven't added any products yet. Let's add at least one to continue.");
  }

  return products;
}
