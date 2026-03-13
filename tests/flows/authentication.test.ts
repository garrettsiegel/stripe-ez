import { describe, expect, it } from 'vitest';
import { keyHint } from '../../src/utils/validation.js';

describe('keyHint', () => {
  it('masks key safely', () => {
    const key = ['sk', 'test', '1234567890'].join('_');
    expect(keyHint(key)).toContain('...');
  });
});
