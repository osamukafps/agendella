import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProfessionalAbsencesApiService } from './professional-absences-api.service';
import type { ProfessionalAbsenceResponse, PaginatedResponse } from '../../core/api/api.models';

const MOCK_ABSENCE: ProfessionalAbsenceResponse = {
  id: 'abs-1',
  professionalId: 'prof-1',
  startAtUtc: '2024-06-10T08:00:00Z',
  endAtUtc: '2024-06-10T12:00:00Z',
  reason: 'Consulta médica',
  status: 'Active',
  cancelledAtUtc: null,
  createdAtUtc: '2024-06-09T10:00:00Z',
};

const PAGE: PaginatedResponse<ProfessionalAbsenceResponse> = { items: [MOCK_ABSENCE], nextCursor: null };

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(ProfessionalAbsencesApiService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('ProfessionalAbsencesApiService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  // ── list() ─────────────────────────────────────────────────────────────────

  it('list() faz GET /professionals/{id}/absences e retorna paginação', async () => {
    const { service, http } = setup();
    const p = service.list('prof-1');
    http.expectOne(r => r.url.endsWith('/professionals/prof-1/absences') && r.method === 'GET')
      .flush(PAGE);
    const result = await p;
    expect(result.items).toHaveLength(1);
    expect(result.items[0].reason).toBe('Consulta médica');
  });

  it('list() escopa pelo professionalId correto na URL', async () => {
    const { service, http } = setup();
    const p = service.list('prof-42');
    const req = http.expectOne(r => r.url.includes('/professionals/'));
    expect(req.request.url).toContain('/professionals/prof-42/absences');
    req.flush({ items: [], nextCursor: null });
    await p;
  });

  it('list() envia cursor quando fornecido', async () => {
    const { service, http } = setup();
    const p = service.list('prof-1', 'cursor-abc');
    const req = http.expectOne(r => r.url.includes('/professionals/prof-1/absences'));
    expect(req.request.params.get('cursor')).toBe('cursor-abc');
    req.flush(PAGE);
    await p;
  });

  it('list() não envia cursor quando ausente', async () => {
    const { service, http } = setup();
    const p = service.list('prof-1');
    const req = http.expectOne(r => r.url.includes('/absences'));
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(PAGE);
    await p;
  });

  it('list() retorna lista vazia quando não há ausências', async () => {
    const { service, http } = setup();
    const p = service.list('prof-1');
    http.expectOne(r => r.url.includes('/absences')).flush({ items: [], nextCursor: null });
    const result = await p;
    expect(result.items).toHaveLength(0);
  });

  // ── create() ───────────────────────────────────────────────────────────────

  it('create() faz POST /professional-absences com payload correto', async () => {
    const { service, http } = setup();
    const payload = {
      professionalId: 'prof-1',
      startAtUtc: '2024-06-10T08:00:00Z',
      endAtUtc: '2024-06-10T12:00:00Z',
      reason: 'Consulta',
    };
    const p = service.create(payload);
    const req = http.expectOne(r => r.url.endsWith('/professional-absences') && r.method === 'POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...MOCK_ABSENCE, ...payload, id: 'abs-2' });
    const result = await p;
    expect(result.id).toBe('abs-2');
    expect(result.reason).toBe('Consulta');
  });

  it('create() usa rota /professional-absences (sem id de profissional)', async () => {
    const { service, http } = setup();
    const payload = { professionalId: 'prof-1', startAtUtc: '', endAtUtc: '', reason: '' };
    const p = service.create(payload);
    const req = http.expectOne(r => r.method === 'POST');
    expect(req.request.url).toMatch(/\/professional-absences$/);
    req.flush(MOCK_ABSENCE);
    await p;
  });

  // ── cancel() ───────────────────────────────────────────────────────────────

  it('cancel() faz POST /professionals/{profId}/absences/{absId}/cancel', async () => {
    const { service, http } = setup();
    const p = service.cancel('prof-1', 'abs-1');
    const req = http.expectOne(r =>
      r.url.endsWith('/professionals/prof-1/absences/abs-1/cancel') && r.method === 'POST'
    );
    expect(req.request.body).toBeNull();
    req.flush(null, { status: 204, statusText: 'No Content' });
    await expect(p).resolves.toBeUndefined();
  });

  it('cancel() usa os ids corretos na URL', async () => {
    const { service, http } = setup();
    const p = service.cancel('prof-99', 'abs-42');
    const req = http.expectOne(r => r.method === 'POST' && r.url.includes('/absences/'));
    expect(req.request.url).toContain('/professionals/prof-99/absences/abs-42/cancel');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await p;
  });
});
