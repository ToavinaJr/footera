import { describe, expect, it } from 'vitest';
import { sanitizeMultilineText, sanitizePlainText } from './sanitize.utils.js';

describe('sanitization utilities', () => {
  it('removes control characters and trims bounded plain text', () => {
    expect(sanitizePlainText('  Foot\u0000era   FC  ', 20)).toBe('Footera FC');
  });

  it('preserves line breaks in bounded multiline text', () => {
    expect(sanitizeMultilineText('line 1\r\nline\u00002', 20)).toBe('line 1\nline2');
  });
});
