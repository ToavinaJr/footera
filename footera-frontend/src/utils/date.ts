export function getTodayDateInputValue(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

export function formatDateForDisplay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date);
}

export function normalizeDateKey(value: string): string {
  const normalized = value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('fr-FR');
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const match = /^(?:[a-z]+\s+)?(\d{1,2})\s+([a-z]+)\s+(\d{4})$/.exec(normalized);
  if (!match) return value.trim();
  const months = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
  const month = months.indexOf(match[2]);
  if (month < 0) return value.trim();
  return `${match[3]}-${String(month + 1).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
}
