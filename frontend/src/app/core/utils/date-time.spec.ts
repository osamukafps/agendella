import { describe, expect, it } from 'vitest';
import {
  formatDateForDisplay,
  formatTimeFromParts,
  getTodayIsoDate,
  isValidIsoDate,
  isValidTimeValue,
  localDateTimeToUtc,
  utcToLocalDateTimeParts,
} from './date-time';

describe('isValidIsoDate', () => {
  it('aceita uma data válida', () => {
    expect(isValidIsoDate('2026-07-01')).toBe(true);
  });

  it('rejeita datas impossíveis', () => {
    expect(isValidIsoDate('2026-02-31')).toBe(false);
  });
});

describe('formatDateForDisplay', () => {
  it('formata data em pt-BR', () => {
    expect(formatDateForDisplay('2026-07-01')).toBe('01/07/2026');
  });
});

describe('getTodayIsoDate', () => {
  it('retorna uma data ISO local', () => {
    expect(getTodayIsoDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('isValidTimeValue', () => {
  it('aceita horário válido', () => {
    expect(isValidTimeValue('09:30')).toBe(true);
  });

  it('rejeita horário inválido', () => {
    expect(isValidTimeValue('25:99')).toBe(false);
  });
});

describe('formatTimeFromParts', () => {
  it('combina hora e minuto em HH:mm', () => {
    expect(formatTimeFromParts('09', '45')).toBe('09:45');
  });
});

describe('utcToLocalDateTimeParts', () => {
  it('extrai data e hora local do UTC', () => {
    const parts = utcToLocalDateTimeParts('2026-07-01T12:30:00Z');
    expect(parts.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(parts.time).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('localDateTimeToUtc', () => {
  it('converte data/hora local válida para UTC ISO', () => {
    expect(localDateTimeToUtc('2026-07-01', '09:30')).toMatch(/Z$/);
  });

  it('retorna null para entrada inválida', () => {
    expect(localDateTimeToUtc('2026-07-01', '25:99')).toBeNull();
  });
});
