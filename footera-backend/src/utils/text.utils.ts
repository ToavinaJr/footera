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

export function parseCookieValue(header: string | undefined, key: string): string | undefined {
  if (!header) return undefined;
  const prefix = `${key}=`;
  const value = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix))?.slice(prefix.length);
  if (!value) return undefined;
  try { return decodeURIComponent(value); } catch { return value; }
}

export function normalizeOriginList(value: string | undefined, fallback: string): string[] {
  return (value || fallback).split(',').map((origin) => origin.trim().replace(/\/+$/, '')).filter(Boolean);
}

export function isValidPhoneNumber(value: string): boolean {
  return /^[+()\d.\-\s]{7,32}$/.test(value);
}

export function isValidEmailAddress(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
