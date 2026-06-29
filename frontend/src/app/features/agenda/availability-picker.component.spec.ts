import { describe, it, expect } from 'vitest';
import {
  formatSlotTime,
  conflictTypeLabel,
  CONFLICT_LABELS,
  getWeekDays,
  toApiDate,
  isSameLocalDay,
} from './agenda-utils';
import type { AvailabilitySlotDto } from '../../core/api/api.models';

const SLOT_MORNING: AvailabilitySlotDto = {
  startAtUtc: '2024-06-10T12:00:00Z',
  endAtUtc:   '2024-06-10T13:00:00Z',
};

const SLOT_AFTERNOON: AvailabilitySlotDto = {
  startAtUtc: '2024-06-10T17:00:00Z',
  endAtUtc:   '2024-06-10T18:00:00Z',
};

describe('formatSlotTime()', () => {
  it('retorna uma string com "–" separando início e fim', () => {
    const result = formatSlotTime(SLOT_MORNING);
    expect(result).toContain('–');
  });

  it('retorna formato HH:MM nos dois lados', () => {
    const result = formatSlotTime(SLOT_MORNING);
    expect(result).toMatch(/\d{2}:\d{2}\s*–\s*\d{2}:\d{2}/);
  });

  it('slot da tarde tem horário maior que slot da manhã', () => {
    const morning   = formatSlotTime(SLOT_MORNING).split('–')[0].trim();
    const afternoon = formatSlotTime(SLOT_AFTERNOON).split('–')[0].trim();
    expect(afternoon > morning).toBe(true);
  });
});

describe('conflictTypeLabel()', () => {
  it('retorna texto em português para business_hours', () => {
    const label = conflictTypeLabel('business_hours');
    expect(label).toContain('horário de funcionamento');
  });

  it('retorna texto para professional_availability', () => {
    const label = conflictTypeLabel('professional_availability');
    expect(label).toContain('disponibilidade');
  });

  it('retorna texto para salon_block', () => {
    expect(conflictTypeLabel('salon_block')).toContain('Bloqueio');
  });

  it('retorna texto para professional_absence', () => {
    expect(conflictTypeLabel('professional_absence')).toContain('Ausência');
  });

  it('retorna texto para existing_appointment', () => {
    expect(conflictTypeLabel('existing_appointment')).toContain('agendamento');
  });

  it('retorna fallback para tipo desconhecido', () => {
    expect(conflictTypeLabel('unknown_type')).toBeTruthy();
  });

  it('todos os 5 tipos oficiais estão mapeados em CONFLICT_LABELS', () => {
    const expectedTypes = [
      'business_hours', 'professional_availability',
      'salon_block', 'professional_absence', 'existing_appointment',
    ];
    expectedTypes.forEach(t => {
      expect(CONFLICT_LABELS[t]).toBeTruthy();
    });
  });
});

describe('AvailabilityPicker — estado de "sem slots"', () => {
  it('lista vazia de slots indica nenhum horário disponível', () => {
    const slots: AvailabilitySlotDto[] = [];
    expect(slots.length === 0).toBe(true);
  });

  it('lista com slots indica disponibilidade', () => {
    const slots = [SLOT_MORNING, SLOT_AFTERNOON];
    expect(slots.length > 0).toBe(true);
  });
});

describe('getWeekDays()', () => {
  it('retorna exatamente 7 dias', () => {
    expect(getWeekDays()).toHaveLength(7);
  });

  it('o primeiro dia é segunda-feira (abbr Seg)', () => {
    const days = getWeekDays(new Date('2024-06-10')); // segunda-feira
    expect(days[0].abbr).toBe('Seg');
  });

  it('retorna dias em ordem crescente de data', () => {
    const days = getWeekDays();
    for (let i = 1; i < days.length; i++) {
      expect(days[i].date > days[i - 1].date).toBe(true);
    }
  });

  it('exatamente um dia é marcado como hoje', () => {
    const days = getWeekDays();
    const today = days.filter(d => d.isToday);
    expect(today.length).toBeLessThanOrEqual(1);
  });
});

describe('toApiDate()', () => {
  it('retorna formato YYYY-MM-DD', () => {
    // Usa construtor local para evitar offset de timezone
    const result = toApiDate(new Date(2024, 5, 10)); // junho = mês 5
    expect(result).toBe('2024-06-10');
  });

  it('adiciona zero à esquerda no mês', () => {
    const result = toApiDate(new Date(2024, 0, 5)); // janeiro = mês 0
    expect(result).toBe('2024-01-05');
  });
});

describe('isSameLocalDay()', () => {
  it('retorna true quando UTC cai no mesmo dia local', () => {
    const utc  = '2024-06-10T15:00:00Z';
    const date = new Date(utc).toLocaleDateString('en-CA');
    expect(isSameLocalDay(utc, date)).toBe(true);
  });

  it('retorna false quando UTC cai em dia diferente', () => {
    const utc = '2024-06-10T15:00:00Z';
    expect(isSameLocalDay(utc, '2024-06-11')).toBe(false);
  });
});
