/** Normalize user-provided plain text before persistence; React/API output still escapes markup. */
function removeControlCharacters(value: string): string {
  return Array.from(value).filter((character) => {
    const code = character.charCodeAt(0);
    return !((code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127);
  }).join('');
}

export function sanitizePlainText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return removeControlCharacters(value)
    .replace(/[ \t]+/g, ' ')
    .trim()
    .slice(0, Math.max(0, Math.trunc(maxLength)));
}

export function sanitizeMultilineText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return removeControlCharacters(value)
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, Math.max(0, Math.trunc(maxLength)));
}
