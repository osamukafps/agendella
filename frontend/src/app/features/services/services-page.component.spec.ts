import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ServicesApiService } from './services-api.service';
import type { ServiceResponse, PaginatedResponse } from '../../core/api/api.models';

const MOCK_SERVICE: ServiceResponse = {
  id: 'svc-1', name: 'Corte de Cabelo', description: 'Corte simples',
  durationMinutes: 60, priceAmount: 50, currency: 'BRL', status: 'Active',
  createdAtUtc: '2024-01-01T00:00:00Z', updatedAtUtc: '2024-01-01T00:00:00Z',
};

const PAGINATED: PaginatedResponse<ServiceResponse> = { items: [MOCK_SERVICE], nextCursor: null };

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(ServicesApiService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('ServicesApiService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('list() faz GET /services e retorna paginação', async () => {
    const { service, http } = setup();
    const promise = service.list();
    http.expectOne(r => r.url.endsWith('/services') && r.method === 'GET').flush(PAGINATED);
    const result = await promise;
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('Corte de Cabelo');
    expect(result.nextCursor).toBeNull();
  });

  it('list() envia cursor quando fornecido', async () => {
    const { service, http } = setup();
    const promise = service.list('cursor-abc');
    const req = http.expectOne(r => r.url.includes('/services'));
    expect(req.request.params.get('cursor')).toBe('cursor-abc');
    req.flush(PAGINATED);
    await promise;
  });

  it('create() faz POST /services com o payload correto', async () => {
    const { service, http } = setup();
    const payload = { name: 'Escova', description: '', durationMinutes: 45, priceAmount: 80, currency: 'BRL' };
    const promise = service.create(payload);
    const req = http.expectOne(r => r.url.endsWith('/services') && r.method === 'POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...MOCK_SERVICE, ...payload, id: 'svc-2' });
    const result = await promise;
    expect(result.name).toBe('Escova');
  });

  it('update() faz PUT /services/{id}', async () => {
    const { service, http } = setup();
    const payload = { name: 'Corte+Escova', description: '', durationMinutes: 90, priceAmount: 100, currency: 'BRL' };
    const promise = service.update('svc-1', payload);
    const req = http.expectOne(r => r.url.endsWith('/services/svc-1') && r.method === 'PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...MOCK_SERVICE, ...payload });
    const result = await promise;
    expect(result.name).toBe('Corte+Escova');
  });

  it('deactivate() faz POST /services/{id}/deactivate', async () => {
    const { service, http } = setup();
    const promise = service.deactivate('svc-1');
    const req = http.expectOne(r => r.url.endsWith('/services/svc-1/deactivate') && r.method === 'POST');
    req.flush(null, { status: 204, statusText: 'No Content' });
    await expect(promise).resolves.toBeUndefined();
  });

  it('deactivate() resolve como void, não retorna dados', async () => {
    const { service, http } = setup();
    const promise = service.deactivate('svc-1');
    http.expectOne(r => r.url.includes('/deactivate')).flush(null, { status: 204, statusText: 'No Content' });
    const result = await promise;
    expect(result).toBeUndefined();
  });
});
