import { describe, expect, it } from 'vitest';
import { parseUsdToCents } from '../../src/utils/validation.js';

describe('parseUsdToCents', () => {
  it('converts decimal dollars to cents', () => {
    expect(parseUsdToCents('49.99')).toBe(4999);
  });
});
