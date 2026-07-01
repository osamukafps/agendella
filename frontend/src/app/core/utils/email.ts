const SIMPLE_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim();
}

export function getEmailValidationMessage(value: string, required = false): string | null {
  const normalized = normalizeEmail(value);

  if (!normalized) {
    return required ? 'Informe um e-mail válido.' : null;
  }

  return SIMPLE_EMAIL_PATTERN.test(normalized) ? null : 'Informe um e-mail válido.';
}
