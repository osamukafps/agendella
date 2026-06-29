import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ClientHistoryApiService } from './client-history-api.service';
import type { ClientHistoryEventResponse, ClientResponse, PaginatedResponse } from '../../core/api/api.models';

const MOCK_CLIENT: ClientResponse = {
  id: 'cli-1', name: 'Maria Souza', phone: '11999999999',
  email: 'maria@email.com', notes: '', status: 'Active',
  createdAtUtc: '2024-01-01T00:00:00Z', updatedAtUtc: '2024-01-01T00:00:00Z',
};

const MOCK_EVENT: ClientHistoryEventResponse = {
  id: 'evt-1', clientId: 'cli-1', appointmentId: 'appt-1',
  type: 'AppointmentCreated', occurredAtUtc: '2024-06-10T13:00:00Z',
  description: 'Agendamento criado', createdAtUtc: '2024-06-10T13:00:00Z',
};

const PAGE: PaginatedResponse<ClientHistoryEventResponse> = {
  items: [MOCK_EVENT], nextCursor: null,
};

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(ClientHistoryApiService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('ClientHistoryApiService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('getClient() faz GET /clients/{id} e retorna o cliente', async () => {
    const { service, http } = setup();
    const p = service.getClient('cli-1');
    http.expectOne(r => r.url.endsWith('/clients/cli-1') && r.method === 'GET').flush(MOCK_CLIENT);
    const result = await p;
    expect(result.name).toBe('Maria Souza');
  });

  it('getHistory() faz GET /clients/{id}/history e retorna paginação', async () => {
    const { service, http } = setup();
    const p = service.getHistory('cli-1');
    http.expectOne(r => r.url.endsWith('/clients/cli-1/history') && r.method === 'GET').flush(PAGE);
    const result = await p;
    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe('AppointmentCreated');
    expect(result.nextCursor).toBeNull();
  });

  it('getHistory() envia cursor quando fornecido', async () => {
    const { service, http } = setup();
    const p = service.getHistory('cli-1', 'cursor-abc');
    const req = http.expectOne(r => r.url.includes('/clients/cli-1/history'));
    expect(req.request.params.get('cursor')).toBe('cursor-abc');
    req.flush({ items: [], nextCursor: null });
    await p;
  });

  it('getHistory() retorna nextCursor quando há mais itens', async () => {
    const { service, http } = setup();
    const p = service.getHistory('cli-1');
    http.expectOne(r => r.url.includes('/clients/cli-1/history'))
      .flush({ items: [MOCK_EVENT], nextCursor: 'next-page-token' });
    const result = await p;
    expect(result.nextCursor).toBe('next-page-token');
  });

  it('getHistory() retorna lista vazia quando cliente não tem histórico', async () => {
    const { service, http } = setup();
    const p = service.getHistory('cli-1');
    http.expectOne(r => r.url.includes('/clients/cli-1/history'))
      .flush({ items: [], nextCursor: null });
    const result = await p;
    expect(result.items).toHaveLength(0);
  });

  it('getHistory() escopa pelo clientId correto na URL', async () => {
    const { service, http } = setup();
    const p = service.getHistory('cli-99');
    const req = http.expectOne(r => r.url.includes('/clients/'));
    expect(req.request.url).toContain('/clients/cli-99/history');
    req.flush({ items: [], nextCursor: null });
    await p;
  });

  it('getHistory() não envia cursor quando não fornecido', async () => {
    const { service, http } = setup();
    const p = service.getHistory('cli-1');
    const req = http.expectOne(r => r.url.includes('/clients/cli-1/history'));
    expect(req.request.params.has('cursor')).toBe(false);
    req.flush(PAGE);
    await p;
  });
});
