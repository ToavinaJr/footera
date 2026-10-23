import { parseIsoDateOnly } from '../../utils/date.utils.js';

export function calculateAge(value?: unknown): number | undefined {
  const birthDate = parseIsoDateOnly(value);
  if (!birthDate) return undefined;
  const year = birthDate.getUTCFullYear();
  const month = birthDate.getUTCMonth() + 1;
  const day = birthDate.getUTCDate();
  const now = new Date();
  let age = now.getUTCFullYear() - year;
  if (now.getUTCMonth() + 1 < month || (now.getUTCMonth() + 1 === month && now.getUTCDate() < day)) age -= 1;
  return age >= 0 ? age : undefined;
}
