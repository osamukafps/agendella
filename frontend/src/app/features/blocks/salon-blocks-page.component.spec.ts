import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SalonBlocksApiService } from './salon-blocks-api.service';
import type { SalonBlockResponse, PaginatedResponse } from '../../core/api/api.models';

const MOCK_BLOCK: SalonBlockResponse = {
  id: 'blk-1',
  startAtUtc: '2024-06-10T08:00:00Z',
  endAtUtc: '2024-06-10T10:00:00Z',
  reason: 'Manutenção',
  createdAtUtc: '2024-06-09T12:00:00Z',
};

const PAGE: PaginatedResponse<SalonBlockResponse> = { items: [MOCK_BLOCK], nextCursor: null };

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(SalonBlocksApiService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('SalonBlocksApiService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  // ── list() ─────────────────────────────────────────────────────────────────

  it('list() faz GET /salon-blocks e retorna paginação', async () => {
    const { service, http } = setup();
    const p = service.list();
    http.expectOne(r => r.url.endsWith('/salon-blocks') && r.method === 'GET').flush(PAGE);
    const result = await p;
    expect(result.items).toHaveLength(1);
    expect(result.items[0].reason).toBe('Manutenção');
    expect(result.nextCursor).toBeNull();
  });

  it('list() envia cursor quando fornecido', async () => {
    const { service, http } = setup();
    const p = service.list('cursor-xyz');
    const req = http.expectOne(r => r.url.includes('/salon-blocks'));
    expect(req.request.params.get('cursor')).toBe('cursor-xyz');
    req.flush(PAGE);
    await p;
  });

  it('list() não envia cursor quando ausente', async () => {
    const { service, http } = setup();
    const p = service.list();
    const req = http.expectOne(r => r.url.includes('/salon-blocks') && r.method === 'GET');
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(PAGE);
    await p;
  });

  it('list() retorna lista vazia quando não há bloqueios', async () => {
    const { service, http } = setup();
    const p = service.list();
    http.expectOne(r => r.url.endsWith('/salon-blocks')).flush({ items: [], nextCursor: null });
    const result = await p;
    expect(result.items).toHaveLength(0);
  });

  // ── create() ───────────────────────────────────────────────────────────────

  it('create() faz POST /salon-blocks com payload correto', async () => {
    const { service, http } = setup();
    const payload = {
      startAtUtc: '2024-06-10T08:00:00Z',
      endAtUtc: '2024-06-10T10:00:00Z',
      reason: 'Reunião',
    };
    const p = service.create(payload);
    const req = http.expectOne(r => r.url.endsWith('/salon-blocks') && r.method === 'POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...MOCK_BLOCK, ...payload, id: 'blk-2' });
    const result = await p;
    expect(result.reason).toBe('Reunião');
  });

  it('create() retorna o bloco criado com id', async () => {
    const { service, http } = setup();
    const payload = { startAtUtc: '2024-06-10T08:00:00Z', endAtUtc: '2024-06-10T09:00:00Z', reason: 'Evento' };
    const p = service.create(payload);
    http.expectOne(r => r.method === 'POST').flush({ ...MOCK_BLOCK, id: 'blk-novo' });
    const result = await p;
    expect(result.id).toBe('blk-novo');
  });

  // ── delete() ───────────────────────────────────────────────────────────────

  it('delete() faz DELETE /salon-blocks/{id}', async () => {
    const { service, http } = setup();
    const p = service.delete('blk-1');
    http.expectOne(r => r.url.endsWith('/salon-blocks/blk-1') && r.method === 'DELETE')
      .flush(null, { status: 204, statusText: 'No Content' });
    await expect(p).resolves.toBeUndefined();
  });

  it('delete() usa o id correto na URL', async () => {
    const { service, http } = setup();
    const p = service.delete('blk-99');
    const req = http.expectOne(r => r.method === 'DELETE');
    expect(req.request.url).toContain('/salon-blocks/blk-99');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await p;
  });
});
