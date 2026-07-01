import { describe, expect, it } from 'vitest';
import type { ClientHistoryEventResponse } from '../../core/api/api.models';
import {
  buildClientHistoryTimelineGroups,
  extractHistoryScheduleLabel,
  formatHistoryGroupLabel,
  normalizeHistoryDescription,
} from './client-history-page.helpers';

describe('client-history-page.helpers', () => {
  it('agrupa eventos por dia em ordem decrescente', () => {
    const events: ClientHistoryEventResponse[] = [
      {
        id: 'evt-older',
        clientId: 'cli-1',
        appointmentId: 'appt-1',
        type: 'Completed',
        occurredAtUtc: '2026-07-01T11:00:00Z',
        description: 'Atendimento concluído.',
        createdAtUtc: '2026-07-01T11:00:00Z',
      },
      {
        id: 'evt-newer',
        clientId: 'cli-1',
        appointmentId: 'appt-2',
        type: 'AppointmentCreated',
        occurredAtUtc: '2026-07-02T10:00:00Z',
        description: 'Agendamento criado.',
        createdAtUtc: '2026-07-02T10:00:00Z',
      },
      {
        id: 'evt-same-day',
        clientId: 'cli-1',
        appointmentId: 'appt-3',
        type: 'Rescheduled',
        occurredAtUtc: '2026-07-02T08:00:00Z',
        description: 'Reagendado.',
        createdAtUtc: '2026-07-02T08:00:00Z',
      },
    ];

    const groups = buildClientHistoryTimelineGroups(events, new Date('2026-07-02T15:00:00Z'));

    expect(groups).toHaveLength(2);
    expect(groups[0].label).toBe('Hoje');
    expect(groups[0].items.map(item => item.id)).toEqual(['evt-newer', 'evt-same-day']);
    expect(groups[1].label).toBe('Ontem');
    expect(groups[1].items.map(item => item.id)).toEqual(['evt-older']);
  });

  it('normaliza descricoes removendo UTC e inserindo "às"', () => {
    expect(normalizeHistoryDescription('Agendamento criado para 30/06/2026 14:45 UTC.'))
      .toBe('Agendamento criado para 30/06/2026 às 14:45.');
  });

  it('extrai a data e hora relacionada ao agendamento quando presente', () => {
    expect(extractHistoryScheduleLabel('Agendamento criado para 30/06/2026 às 14:45.'))
      .toBe('30/06/2026 às 14:45');
  });

  it('retorna labels relativas para hoje e ontem', () => {
    const now = new Date('2026-07-02T12:00:00Z');
    expect(formatHistoryGroupLabel('2026-07-02T08:00:00Z', now)).toBe('Hoje');
    expect(formatHistoryGroupLabel('2026-07-01T08:00:00Z', now)).toBe('Ontem');
  });
});
