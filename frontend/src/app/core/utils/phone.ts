/** Strips all non-digit characters from a phone string. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Applies Brazilian phone mask progressively.
 *  (00) 00000-0000 for 11-digit mobile numbers
 *  (00) 0000-0000  for 10-digit landline numbers
 */
export function applyPhoneMask(raw: string): string {
  const d = digitsOnly(raw).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  const ddd  = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (d.length <= 10)   return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

/** Formats a stored phone value (digits-only, possibly prefixed with +55) for display. */
export function formatStoredPhone(stored: string): string {
  const d = digitsOnly(stored.replace(/^\+55/, ''));
  return applyPhoneMask(d);
}
