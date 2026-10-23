export function normalizeSearchText(value: unknown, locale = 'fr-FR'): string {
  if (typeof value !== 'string') return '';
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase(locale);
}

export function splitDelimitedText(value: unknown, delimiters = /[,;&/]+/): string[] {
  if (typeof value !== 'string') return [];
  return value.split(delimiters).map((part) => part.trim()).filter(Boolean);
}

export function slugify(value: string): string {
  return normalizeSearchText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function toCamelCase(value: string): string {
  return value.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}
