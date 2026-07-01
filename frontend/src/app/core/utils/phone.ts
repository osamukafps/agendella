export const PHONE_MASK_MAX_LENGTH = 15;

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

/** Validates Brazilian landline/mobile lengths after removing formatting. */
export function getPhoneValidationMessage(raw: string, required = true): string | null {
  const digits = digitsOnly(raw.replace(/^\+55/, ''));

  if (!digits.length) {
    return required ? 'Informe um telefone válido.' : null;
  }

  return digits.length === 10 || digits.length === 11
    ? null
    : 'Informe um telefone fixo ou celular válido.';
}

export function shouldBlockPhoneKey(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false;
  }

  if (event.key.length !== 1) {
    return false;
  }

  return !/\d/.test(event.key);
}

export function shouldBlockPhoneBeforeInput(event: InputEvent): boolean {
  const inputType = event.inputType ?? '';

  if (inputType.startsWith('delete')) {
    return false;
  }

  if (!event.data) {
    return false;
  }

  return /\D/.test(event.data);
}
