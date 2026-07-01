import { describe, expect, it } from 'vitest';
import { getEmailValidationMessage, normalizeEmail } from './email';

describe('normalizeEmail', () => {
  it('remove espaços nas pontas', () => {
    expect(normalizeEmail('  maria@salon.com  ')).toBe('maria@salon.com');
  });
});

describe('getEmailValidationMessage', () => {
  it('aceita campo vazio quando não é obrigatório', () => {
    expect(getEmailValidationMessage('')).toBeNull();
  });

  it('exige valor quando obrigatório', () => {
    expect(getEmailValidationMessage('', true)).toContain('e-mail válido');
  });

  it('rejeita formato inválido', () => {
    expect(getEmailValidationMessage('maria salão.com')).toContain('e-mail válido');
  });

  it('aceita formato válido', () => {
    expect(getEmailValidationMessage('maria@salon.com')).toBeNull();
  });
});
