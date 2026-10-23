import { describe, expect, it } from 'vitest';
import { isFiniteNumberInRange, isIntegerInRange, roundTo, toFiniteNumber } from './number.utils.js';

describe('number utilities', () => {
  it('rejects non-finite values and validates integer ranges', () => {
    expect(isFiniteNumberInRange(Number.NaN, 0, 10)).toBe(false);
    expect(isIntegerInRange(2.5, 0, 10)).toBe(false);
    expect(isIntegerInRange(3, 0, 10)).toBe(true);
  });

  it('parses finite numeric strings and rounds consistently', () => {
    expect(toFiniteNumber(' 12.5 ')).toBe(12.5);
    expect(toFiniteNumber('')).toBeUndefined();
    expect(roundTo(1.005, 2)).toBe(1.01);
  });
});
