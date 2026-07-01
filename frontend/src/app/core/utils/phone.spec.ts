import { describe, expect, it } from 'vitest';
import {
  applyPhoneMask,
  formatStoredPhone,
  getPhoneValidationMessage,
  PHONE_MASK_MAX_LENGTH,
  shouldBlockPhoneBeforeInput,
  shouldBlockPhoneKey,
} from './phone';

describe('applyPhoneMask', () => {
  it('mascara celular brasileiro com 11 dígitos', () => {
    expect(applyPhoneMask('11999999999')).toBe('(11) 99999-9999');
  });

  it('mascara fixo brasileiro com 10 dígitos', () => {
    expect(applyPhoneMask('1133334444')).toBe('(11) 3333-4444');
  });
});

describe('formatStoredPhone', () => {
  it('formata número salvo com prefixo +55', () => {
    expect(formatStoredPhone('+5511999999999')).toBe('(11) 99999-9999');
  });
});

describe('getPhoneValidationMessage', () => {
  it('aceita fixo válido', () => {
    expect(getPhoneValidationMessage('(11) 3333-4444')).toBeNull();
  });

  it('aceita celular válido', () => {
    expect(getPhoneValidationMessage('(11) 99999-9999')).toBeNull();
  });

  it('rejeita número incompleto', () => {
    expect(getPhoneValidationMessage('(11) 9999-999')).toContain('válido');
  });
});

describe('PHONE_MASK_MAX_LENGTH', () => {
  it('usa o tamanho do formato celular brasileiro mascarado', () => {
    expect(PHONE_MASK_MAX_LENGTH).toBe(15);
  });
});

describe('shouldBlockPhoneKey', () => {
  it('bloqueia letras', () => {
    const event = new KeyboardEvent('keydown', { key: 'a' });
    expect(shouldBlockPhoneKey(event)).toBe(true);
  });

  it('permite dígitos', () => {
    const event = new KeyboardEvent('keydown', { key: '9' });
    expect(shouldBlockPhoneKey(event)).toBe(false);
  });

  it('permite teclas de navegação', () => {
    const event = new KeyboardEvent('keydown', { key: 'Backspace' });
    expect(shouldBlockPhoneKey(event)).toBe(false);
  });
});

describe('shouldBlockPhoneBeforeInput', () => {
  it('bloqueia inserção de letras', () => {
    const event = new InputEvent('beforeinput', { data: 'x', inputType: 'insertText' });
    expect(shouldBlockPhoneBeforeInput(event)).toBe(true);
  });

  it('permite inserção de dígitos', () => {
    const event = new InputEvent('beforeinput', { data: '5', inputType: 'insertText' });
    expect(shouldBlockPhoneBeforeInput(event)).toBe(false);
  });
});
