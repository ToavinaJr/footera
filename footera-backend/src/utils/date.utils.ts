const FRENCH_MONTHS = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
] as const;

export function parseIsoDateOnly(value: unknown): Date | undefined {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value ? undefined : date;
}

export function toIsoDateKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/** Normalize ISO dates and French long dates used in existing stored records. */
export function normalizeDateKey(value: string): string {
  const normalized = value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR');
  if (parseIsoDateOnly(normalized)) return normalized;
  const match = /^(?:[a-z]+\s+)?(\d{1,2})\s+([a-z]+)\s+(\d{4})$/.exec(normalized);
  if (!match) return value.trim();
  const monthIndex = FRENCH_MONTHS.indexOf(match[2] as (typeof FRENCH_MONTHS)[number]);
  if (monthIndex < 0) return value.trim();
  const dateKey = `${match[3]}-${String(monthIndex + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  return parseIsoDateOnly(dateKey) ? dateKey : value.trim();
}

export function isDateOnOrBeforeToday(value: unknown, now = new Date()): boolean {
  if (typeof value !== 'string') return false;
  const dateKey = normalizeDateKey(value);
  return Boolean(parseIsoDateOnly(dateKey)) && dateKey <= toIsoDateKey(now);
}

export function parseDateTime(value: string): Date | undefined {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? undefined : date;
}
