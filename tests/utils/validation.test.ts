import { describe, expect, it } from 'vitest';
import { keyHint, parseUsdToCents, validateProductName } from '../../src/utils/validation.js';

describe('validation helpers', () => {
  it('rejects empty product names', () => {
    expect(validateProductName('   ')).not.toBe(true);
  });

  it('throws for invalid dollar amount', () => {
    expect(() => parseUsdToCents('0')).toThrow(/greater than \$0/i);
    expect(() => parseUsdToCents('not-a-number')).toThrow(/greater than \$0/i);
  });

  it('returns masked key hint for short keys', () => {
    expect(keyHint('short')).toBe('***');
  });
});
