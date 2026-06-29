import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AgendaApiService, AppointmentConflictError } from './agenda-api.service';
import type { AppointmentResponse, AvailabilitySlotDto, PaginatedResponse } from '../../core/api/api.models';

const APPT: AppointmentResponse = {
  id: 'appt-1', clientId: 'cli-1', professionalId: 'prof-1', serviceId: 'svc-1',
  startAtUtc: '2024-06-10T13:00:00Z', endAtUtc: '2024-06-10T14:00:00Z',
  status: 'Scheduled', requiresReview: false, reviewReason: null,
  createdAtUtc: '2024-06-10T00:00:00Z', updatedAtUtc: '2024-06-10T00:00:00Z',
};

const PAGE: PaginatedResponse<AppointmentResponse> = { items: [APPT], nextCursor: null };

const SLOTS: AvailabilitySlotDto[] = [
  { startAtUtc: '2024-06-10T12:00:00Z', endAtUtc: '2024-06-10T13:00:00Z' },
  { startAtUtc: '2024-06-10T14:00:00Z', endAtUtc: '2024-06-10T15:00:00Z' },
];

function setup() {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  return { api: TestBed.inject(AgendaApiService), http: TestBed.inject(HttpTestingController) };
}

describe('AgendaApiService', () => {
  afterEach(() => { TestBed.inject(HttpTestingController).verify(); TestBed.resetTestingModule(); });

  // ── list() ─────────────────────────────────────────────────────────────────

  it('list() faz GET /appointments sem parâmetros', async () => {
    const { api, http } = setup();
    const p = api.list();
    http.expectOne(r => r.url.endsWith('/appointments') && r.method === 'GET').flush(PAGE);
    const r = await p;
    expect(r.items).toHaveLength(1);
    expect(r.nextCursor).toBeNull();
  });

  it('list() envia cursor quando fornecido', async () => {
    const { api, http } = setup();
    const p = api.list({ cursor: 'abc' });
    const req = http.expectOne(r => r.url.includes('/appointments'));
    expect(req.request.params.get('cursor')).toBe('abc');
    req.flush(PAGE);
    await p;
  });

  it('list() envia pageSize quando fornecido', async () => {
    const { api, http } = setup();
    const p = api.list({ pageSize: 50 });
    const req = http.expectOne(r => r.url.includes('/appointments'));
    expect(req.request.params.get('pageSize')).toBe('50');
    req.flush(PAGE);
    await p;
  });

  // ── searchAvailability() ───────────────────────────────────────────────────

  it('searchAvailability() faz GET /availability com query params corretos', async () => {
    const { api, http } = setup();
    const p = api.searchAvailability('prof-1', '2024-06-10', 60);
    const req = http.expectOne(r => r.url.includes('/availability'));
    expect(req.request.params.get('professionalId')).toBe('prof-1');
    expect(req.request.params.get('date')).toBe('2024-06-10');
    expect(req.request.params.get('durationMinutes')).toBe('60');
    req.flush({ professionalId: 'prof-1', date: '2024-06-10', durationMinutes: 60, slots: SLOTS });
    const r = await p;
    expect(r.slots).toHaveLength(2);
  });

  it('searchAvailability() retorna lista vazia quando não há horários disponíveis', async () => {
    const { api, http } = setup();
    const p = api.searchAvailability('prof-1', '2024-06-10', 120);
    http.expectOne(r => r.url.includes('/availability'))
      .flush({ professionalId: 'prof-1', date: '2024-06-10', durationMinutes: 120, slots: [] });
    const r = await p;
    expect(r.slots).toHaveLength(0);
  });

  // ── create() ───────────────────────────────────────────────────────────────

  it('create() faz POST /appointments com payload correto', async () => {
    const { api, http } = setup();
    const payload = { clientId: 'cli-1', professionalId: 'prof-1', serviceId: 'svc-1',
                      startAtUtc: '2024-06-10T13:00:00Z', manualEndAtUtc: null };
    const p = api.create(payload);
    const req = http.expectOne(r => r.url.endsWith('/appointments') && r.method === 'POST');
    expect(req.request.body).toEqual(payload);
    req.flush(APPT);
    const r = await p;
    expect(r.id).toBe('appt-1');
  });

  it('create() lança AppointmentConflictError em 409', async () => {
    const { api, http } = setup();
    const payload = { clientId: 'cli-1', professionalId: 'prof-1', serviceId: 'svc-1',
                      startAtUtc: '2024-06-10T13:00:00Z', manualEndAtUtc: null };
    const p = api.create(payload);
    http.expectOne(r => r.url.includes('/appointments') && r.method === 'POST').flush(
      { code: 'appointment.conflict', message: 'Conflito', details: { conflictType: 'existing_appointment' } },
      { status: 409, statusText: 'Conflict' }
    );
    await expect(p).rejects.toBeInstanceOf(AppointmentConflictError);
  });

  it('create() preserva conflictType na AppointmentConflictError', async () => {
    const { api, http } = setup();
    const p = api.create({ clientId: '', professionalId: '', serviceId: '', startAtUtc: '', manualEndAtUtc: null });
    http.expectOne(r => r.method === 'POST').flush(
      { code: 'appointment.conflict', details: { conflictType: 'salon_block' } },
      { status: 409, statusText: 'Conflict' }
    );
    try { await p; } catch (e) {
      expect((e as AppointmentConflictError).conflictType).toBe('salon_block');
    }
  });

  // ── reschedule() ───────────────────────────────────────────────────────────

  it('reschedule() faz POST /appointments/{id}/reschedule', async () => {
    const { api, http } = setup();
    const req = { newStartAtUtc: '2024-06-10T15:00:00Z', newManualEndAtUtc: null };
    const p = api.reschedule('appt-1', req);
    const httpReq = http.expectOne(r => r.url.endsWith('/appointments/appt-1/reschedule'));
    expect(httpReq.request.body).toEqual(req);
    httpReq.flush({ ...APPT, startAtUtc: req.newStartAtUtc });
    const r = await p;
    expect(r.startAtUtc).toBe(req.newStartAtUtc);
  });

  // ── ações de resultado ─────────────────────────────────────────────────────

  it('cancel() faz POST /appointments/{id}/cancel', async () => {
    const { api, http } = setup();
    const p = api.cancel('appt-1');
    http.expectOne(r => r.url.endsWith('/appointments/appt-1/cancel') && r.method === 'POST')
      .flush(null, { status: 204, statusText: 'No Content' });
    await expect(p).resolves.toBeUndefined();
  });

  it('complete() faz POST /appointments/{id}/complete', async () => {
    const { api, http } = setup();
    const p = api.complete('appt-1');
    http.expectOne(r => r.url.endsWith('/appointments/appt-1/complete')).flush(null, { status: 204, statusText: 'No Content' });
    await expect(p).resolves.toBeUndefined();
  });

  it('noShow() faz POST /appointments/{id}/no-show', async () => {
    const { api, http } = setup();
    const p = api.noShow('appt-1');
    http.expectOne(r => r.url.endsWith('/appointments/appt-1/no-show')).flush(null, { status: 204, statusText: 'No Content' });
    await expect(p).resolves.toBeUndefined();
  });

  it('resolveReview() faz POST /appointments/{id}/resolve-review', async () => {
    const { api, http } = setup();
    const p = api.resolveReview('appt-1');
    http.expectOne(r => r.url.endsWith('/appointments/appt-1/resolve-review')).flush(null, { status: 204, statusText: 'No Content' });
    await expect(p).resolves.toBeUndefined();
  });
});

describe('AppointmentConflictError', () => {
  it('tem name AppointmentConflictError', () => {
    expect(new AppointmentConflictError('existing_appointment').name).toBe('AppointmentConflictError');
  });

  it('expõe conflictType', () => {
    expect(new AppointmentConflictError('salon_block').conflictType).toBe('salon_block');
  });

  it('é instância de Error', () => {
    expect(new AppointmentConflictError('x')).toBeInstanceOf(Error);
  });
});
