import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  toApiDate,
  formatLocalTime,
} from './agenda-utils';
import type { AppointmentResponse } from '../../core/api/api.models';

// ─── Form validation helpers ──────────────────────────────────────────────────

function isCreateFormValid(fields: {
  professionalId: string;
  clientId: string;
  serviceId: string;
  selectedSlot: object | null;
}): boolean {
  return !!(fields.professionalId && fields.clientId && fields.serviceId && fields.selectedSlot);
}

function isRescheduleFormValid(fields: {
  selectedSlot: object | null;
}): boolean {
  return !!fields.selectedSlot;
}

describe('AppointmentForm — validação de criação', () => {
  it('formulário inválido quando professionalId está vazio', () => {
    expect(isCreateFormValid({ professionalId: '', clientId: 'c1', serviceId: 's1', selectedSlot: {} }))
      .toBe(false);
  });

  it('formulário inválido quando clientId está vazio', () => {
    expect(isCreateFormValid({ professionalId: 'p1', clientId: '', serviceId: 's1', selectedSlot: {} }))
      .toBe(false);
  });

  it('formulário inválido quando serviceId está vazio', () => {
    expect(isCreateFormValid({ professionalId: 'p1', clientId: 'c1', serviceId: '', selectedSlot: {} }))
      .toBe(false);
  });

  it('formulário inválido quando nenhum slot foi selecionado', () => {
    expect(isCreateFormValid({ professionalId: 'p1', clientId: 'c1', serviceId: 's1', selectedSlot: null }))
      .toBe(false);
  });

  it('formulário válido quando todos os campos estão preenchidos', () => {
    expect(isCreateFormValid({
      professionalId: 'prof-1',
      clientId: 'cli-1',
      serviceId: 'svc-1',
      selectedSlot: { startAtUtc: '2024-06-10T13:00:00Z', endAtUtc: '2024-06-10T14:00:00Z' },
    })).toBe(true);
  });
});

describe('AppointmentForm — validação de reagendamento', () => {
  it('inválido quando nenhum slot selecionado', () => {
    expect(isRescheduleFormValid({ selectedSlot: null })).toBe(false);
  });

  it('válido quando slot selecionado', () => {
    expect(isRescheduleFormValid({
      selectedSlot: { startAtUtc: '2024-06-10T15:00:00Z', endAtUtc: '2024-06-10T16:00:00Z' },
    })).toBe(true);
  });
});

describe('AppointmentForm — modo create vs reschedule', () => {
  it('modo create: precisa de professional, client e service', () => {
    const createFields = { professionalId: '', clientId: '', serviceId: '', selectedSlot: null };
    expect(isCreateFormValid(createFields)).toBe(false);
  });

  it('modo reschedule: só precisa de slot', () => {
    const rescheduleFields = { selectedSlot: { startAtUtc: '2024-06-10T15:00:00Z', endAtUtc: '2024-06-10T16:00:00Z' } };
    expect(isRescheduleFormValid(rescheduleFields)).toBe(true);
  });
});

// ─── Utilitários de display do form ───────────────────────────────────────────

describe('formatDuration()', () => {
  it('60 minutos → "1h"', () => {
    expect(formatDuration('2024-06-10T13:00:00Z', '2024-06-10T14:00:00Z')).toBe('1h');
  });

  it('90 minutos → "1h30"', () => {
    expect(formatDuration('2024-06-10T13:00:00Z', '2024-06-10T14:30:00Z')).toBe('1h30');
  });

  it('30 minutos → "30 min"', () => {
    expect(formatDuration('2024-06-10T13:00:00Z', '2024-06-10T13:30:00Z')).toBe('30 min');
  });

  it('45 minutos → "45 min"', () => {
    expect(formatDuration('2024-06-10T13:00:00Z', '2024-06-10T13:45:00Z')).toBe('45 min');
  });

  it('2 horas → "2h"', () => {
    expect(formatDuration('2024-06-10T10:00:00Z', '2024-06-10T12:00:00Z')).toBe('2h');
  });
});

describe('formatLocalTime()', () => {
  it('retorna formato HH:MM', () => {
    const result = formatLocalTime('2024-06-10T13:00:00Z');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe('toApiDate()', () => {
  it('converte Date local para YYYY-MM-DD', () => {
    expect(toApiDate(new Date(2024, 5, 10))).toBe('2024-06-10'); // junho = mês 5
  });

  it('data com mês de 1 dígito adiciona zero', () => {
    expect(toApiDate(new Date(2024, 0, 5))).toBe('2024-01-05'); // janeiro = mês 0
  });
});
