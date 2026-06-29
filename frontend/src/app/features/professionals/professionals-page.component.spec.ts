import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProfessionalsApiService } from './professionals-api.service';
import {
  slotsToEditorRows,
  editorRowsToSlots,
  isValidTimeRange,
  DAYS,
} from './weekly-availability-editor.component';
import type { ProfessionalResponse, WeeklyAvailabilityEntryDto } from '../../core/api/api.models';

const MOCK_PROFESSIONAL: ProfessionalResponse = {
  id: 'prof-1', name: 'Ana Silva', phone: '11999999999', email: 'ana@salon.com',
  status: 'Active', createdAtUtc: '2024-01-01T00:00:00Z', updatedAtUtc: '2024-01-01T00:00:00Z',
};

const MOCK_SLOTS: WeeklyAvailabilityEntryDto[] = [
  { dayOfWeek: 'Monday', startLocalTime: '09:00', endLocalTime: '17:00' },
  { dayOfWeek: 'Wednesday', startLocalTime: '10:00', endLocalTime: '18:00' },
];

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(ProfessionalsApiService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('ProfessionalsApiService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('list() faz GET /professionals', async () => {
    const { service, http } = setup();
    const promise = service.list();
    http.expectOne(r => r.url.endsWith('/professionals') && r.method === 'GET')
      .flush({ items: [MOCK_PROFESSIONAL], nextCursor: null });
    const result = await promise;
    expect(result.items[0].name).toBe('Ana Silva');
  });

  it('getWeeklyAvailability() faz GET /professionals/{id}/weekly-availability', async () => {
    const { service, http } = setup();
    const promise = service.getWeeklyAvailability('prof-1');
    const req = http.expectOne(r => r.url.endsWith('/professionals/prof-1/weekly-availability'));
    req.flush({ slots: MOCK_SLOTS });
    const result = await promise;
    expect(result).toHaveLength(2);
    expect(result[0].dayOfWeek).toBe('Monday');
  });

  it('updateWeeklyAvailability() faz PUT com slots corretos', async () => {
    const { service, http } = setup();
    const promise = service.updateWeeklyAvailability('prof-1', MOCK_SLOTS);
    const req = http.expectOne(r =>
      r.url.endsWith('/professionals/prof-1/weekly-availability') && r.method === 'PUT'
    );
    expect(req.request.body).toEqual({ slots: MOCK_SLOTS });
    req.flush({ slots: MOCK_SLOTS });
    const result = await promise;
    expect(result).toHaveLength(2);
  });

  it('deactivate() faz POST /professionals/{id}/deactivate', async () => {
    const { service, http } = setup();
    const promise = service.deactivate('prof-1');
    http.expectOne(r => r.url.endsWith('/professionals/prof-1/deactivate') && r.method === 'POST')
      .flush(null, { status: 204, statusText: 'No Content' });
    await expect(promise).resolves.toBeUndefined();
  });
});

// ─── WeeklyAvailabilityEditor pure functions ───────────────────────────────────

describe('slotsToEditorRows()', () => {
  it('marca dias com slots como enabled', () => {
    const rows = slotsToEditorRows(MOCK_SLOTS);
    const monday = rows.find(r => r.dayOfWeek === 'Monday')!;
    expect(monday.enabled).toBe(true);
    expect(monday.start).toBe('09:00');
    expect(monday.end).toBe('17:00');
  });

  it('marca dias sem slots como disabled', () => {
    const rows = slotsToEditorRows(MOCK_SLOTS);
    const tuesday = rows.find(r => r.dayOfWeek === 'Tuesday')!;
    expect(tuesday.enabled).toBe(false);
  });

  it('retorna exatamente 7 linhas (uma por dia)', () => {
    expect(slotsToEditorRows(MOCK_SLOTS)).toHaveLength(7);
  });

  it('preserva defaults de horário para dias sem slot', () => {
    const rows = slotsToEditorRows([]);
    rows.forEach(r => {
      expect(r.start).toBeTruthy();
      expect(r.end).toBeTruthy();
    });
  });
});

describe('editorRowsToSlots()', () => {
  it('converte apenas linhas habilitadas para slots', () => {
    const rows = slotsToEditorRows(MOCK_SLOTS);
    const slots = editorRowsToSlots(rows);
    expect(slots).toHaveLength(2);
  });

  it('não inclui dias desabilitados', () => {
    const rows = slotsToEditorRows([]);
    expect(editorRowsToSlots(rows)).toHaveLength(0);
  });

  it('preserva dayOfWeek, start e end', () => {
    const rows = slotsToEditorRows(MOCK_SLOTS);
    const slots = editorRowsToSlots(rows);
    const monday = slots.find(s => s.dayOfWeek === 'Monday')!;
    expect(monday.startLocalTime).toBe('09:00');
    expect(monday.endLocalTime).toBe('17:00');
  });
});

describe('isValidTimeRange()', () => {
  it('retorna true quando start < end', () => {
    expect(isValidTimeRange('09:00', '17:00')).toBe(true);
  });

  it('retorna false quando start === end', () => {
    expect(isValidTimeRange('09:00', '09:00')).toBe(false);
  });

  it('retorna false quando start > end', () => {
    expect(isValidTimeRange('18:00', '09:00')).toBe(false);
  });

  it('retorna false quando start está vazio', () => {
    expect(isValidTimeRange('', '09:00')).toBe(false);
  });
});

describe('DAYS', () => {
  it('tem 7 dias da semana', () => {
    expect(DAYS).toHaveLength(7);
  });

  it('começa em Monday', () => {
    expect(DAYS[0].key).toBe('Monday');
  });

  it('termina em Sunday', () => {
    expect(DAYS[6].key).toBe('Sunday');
  });
});
