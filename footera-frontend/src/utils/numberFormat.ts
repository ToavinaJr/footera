/** Formats API-provided numeric values without ever exposing NaN or Infinity. */
export function formatFiniteNumber(
  value: unknown,
  fractionDigits = 0,
  fallback = '—',
): string {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) return fallback;
  return number.toLocaleString('fr-FR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function finiteNumberOr(value: unknown, fallback = 0): number {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}
