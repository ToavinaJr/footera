import { describe, expect, it } from 'vitest';
import { isDateOnOrBeforeToday, normalizeDateKey, parseIsoDateOnly } from './date.utils.js';

describe('date utilities', () => {
  it('rejects impossible ISO dates', () => {
    expect(parseIsoDateOnly('2026-02-30')).toBeUndefined();
  });

  it('normalizes legacy French date labels to an ISO key', () => {
    expect(normalizeDateKey('Samedi 24 Octobre 2026')).toBe('2026-10-24');
  });

  it('compares a normalized date against the supplied current date', () => {
    expect(isDateOnOrBeforeToday('2026-10-23', new Date('2026-10-23T12:00:00Z'))).toBe(true);
    expect(isDateOnOrBeforeToday('2026-10-24', new Date('2026-10-23T12:00:00Z'))).toBe(false);
  });
});
