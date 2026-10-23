import { describe, expect, it } from 'vitest';
import { normalizeOriginList, normalizeSearchText, parseCookieValue, splitDelimitedText } from './text.utils.js';

describe('text utilities', () => {
  it('normalizes accents and casing for search', () => {
    expect(normalizeSearchText('  Équipe Footera ')).toBe('equipe footera');
  });

  it('splits configured delimiters and trims empty values', () => {
    expect(splitDelimitedText('A, B; ;C')).toEqual(['A', 'B', 'C']);
  });

  it('parses and decodes a cookie value safely', () => {
    expect(parseCookieValue('other=x; session=abc%2Fdef', 'session')).toBe('abc/def');
    expect(parseCookieValue('session=%E0%A4%A', 'session')).toBe('%E0%A4%A');
  });

  it('normalizes origin lists with a fallback', () => {
    expect(normalizeOriginList(' https://a.test/, http://localhost:3001 ', 'https://fallback.test'))
      .toEqual(['https://a.test', 'http://localhost:3001']);
    expect(normalizeOriginList(undefined, 'https://fallback.test')).toEqual(['https://fallback.test']);
  });
});
