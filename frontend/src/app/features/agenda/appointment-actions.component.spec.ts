import { describe, it, expect } from 'vitest';
import {
  canComplete,
  canNoShow,
  canCancel,
  canReschedule,
  canResolveReview,
  hasAnyAction,
  getStatusLabel,
  getStatusBadgeClass,
  STATUS_LABELS,
} from './agenda-utils';
import type { AppointmentResponse, AppointmentStatus } from '../../core/api/api.models';

function makeAppt(
  status: AppointmentStatus,
  requiresReview = false
): AppointmentResponse {
  return {
    id: 'appt-1', clientId: 'cli-1', professionalId: 'prof-1', serviceId: 'svc-1',
    startAtUtc: '2024-06-10T13:00:00Z', endAtUtc: '2024-06-10T14:00:00Z',
    status, requiresReview, reviewReason: requiresReview ? 'Bloco criado' : null,
    createdAtUtc: '2024-06-10T00:00:00Z', updatedAtUtc: '2024-06-10T00:00:00Z',
  };
}

// ─── canComplete ───────────────────────────────────────────────────────────────

describe('canComplete()', () => {
  it('retorna true para Scheduled', () => { expect(canComplete('Scheduled')).toBe(true); });
  it('retorna false para Completed', () => { expect(canComplete('Completed')).toBe(false); });
  it('retorna false para Cancelled', () => { expect(canComplete('Cancelled')).toBe(false); });
  it('retorna false para NoShow',    () => { expect(canComplete('NoShow')).toBe(false); });
});

// ─── canNoShow ────────────────────────────────────────────────────────────────

describe('canNoShow()', () => {
  it('retorna true para Scheduled', () => { expect(canNoShow('Scheduled')).toBe(true); });
  it('retorna false para Completed', () => { expect(canNoShow('Completed')).toBe(false); });
  it('retorna false para Cancelled', () => { expect(canNoShow('Cancelled')).toBe(false); });
});

// ─── canCancel ────────────────────────────────────────────────────────────────

describe('canCancel()', () => {
  it('retorna true para Scheduled', () => { expect(canCancel('Scheduled')).toBe(true); });
  it('retorna false para Completed', () => { expect(canCancel('Completed')).toBe(false); });
  it('retorna false para Cancelled', () => { expect(canCancel('Cancelled')).toBe(false); });
});

// ─── canReschedule ────────────────────────────────────────────────────────────

describe('canReschedule()', () => {
  it('retorna true para Scheduled', () => { expect(canReschedule('Scheduled')).toBe(true); });
  it('retorna false para Completed', () => { expect(canReschedule('Completed')).toBe(false); });
});

// ─── canResolveReview ─────────────────────────────────────────────────────────

describe('canResolveReview()', () => {
  it('retorna true quando requiresReview é true para administradora', () => {
    expect(canResolveReview(true, 'administradora')).toBe(true);
  });

  it('retorna false quando requiresReview é true para profissional', () => {
    expect(canResolveReview(true, 'profissional')).toBe(false);
  });

  it('retorna false quando requiresReview é false', () => {
    expect(canResolveReview(false, 'administradora')).toBe(false);
  });
});

// ─── hasAnyAction ─────────────────────────────────────────────────────────────

describe('hasAnyAction()', () => {
  it('retorna true para Scheduled', () => {
    expect(hasAnyAction(makeAppt('Scheduled'), 'profissional')).toBe(true);
  });

  it('retorna true para agendamento com revisão pendente de administradora', () => {
    expect(hasAnyAction(makeAppt('Completed', true), 'administradora')).toBe(true);
  });

  it('retorna false para revisão pendente de profissional sem outras ações', () => {
    expect(hasAnyAction(makeAppt('Completed', true), 'profissional')).toBe(false);
  });

  it('retorna false para Completed sem revisão', () => {
    expect(hasAnyAction(makeAppt('Completed', false), 'administradora')).toBe(false);
  });

  it('retorna false para Cancelled sem revisão', () => {
    expect(hasAnyAction(makeAppt('Cancelled', false), 'administradora')).toBe(false);
  });
});

// ─── getStatusLabel ───────────────────────────────────────────────────────────

describe('getStatusLabel()', () => {
  it('Scheduled → "Agendado"', () => { expect(getStatusLabel('Scheduled')).toBe('Agendado'); });
  it('Completed → "Concluído"', () => { expect(getStatusLabel('Completed')).toBe('Concluído'); });
  it('Cancelled → "Cancelado"', () => { expect(getStatusLabel('Cancelled')).toBe('Cancelado'); });
  it('NoShow → "Não compareceu"', () => { expect(getStatusLabel('NoShow')).toBe('Não compareceu'); });

  it('todos os 4 status têm label em português', () => {
    (['Scheduled', 'Completed', 'Cancelled', 'NoShow'] as AppointmentStatus[]).forEach(s => {
      expect(STATUS_LABELS[s]).toBeTruthy();
    });
  });
});

// ─── getStatusBadgeClass ──────────────────────────────────────────────────────

describe('getStatusBadgeClass()', () => {
  it('requiresReview sempre retorna badge-review independente do status', () => {
    expect(getStatusBadgeClass('Scheduled', true)).toBe('badge-review');
    expect(getStatusBadgeClass('Completed', true)).toBe('badge-review');
  });

  it('Scheduled sem revisão retorna badge-scheduled', () => {
    expect(getStatusBadgeClass('Scheduled', false)).toBe('badge-scheduled');
  });

  it('Completed retorna badge-completed', () => {
    expect(getStatusBadgeClass('Completed', false)).toBe('badge-completed');
  });

  it('Cancelled retorna badge-cancelled', () => {
    expect(getStatusBadgeClass('Cancelled', false)).toBe('badge-cancelled');
  });

  it('NoShow retorna badge-noshow', () => {
    expect(getStatusBadgeClass('NoShow', false)).toBe('badge-noshow');
  });
});
