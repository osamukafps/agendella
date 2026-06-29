import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ClientsApiService, ClientPhoneDuplicateError } from './clients-api.service';
import type { ClientResponse, PaginatedResponse } from '../../core/api/api.models';

const MOCK_CLIENT: ClientResponse = {
  id: 'cli-1', name: 'Maria Souza', phone: '11999999999',
  email: 'maria@email.com', notes: 'VIP', status: 'Active',
  createdAtUtc: '2024-01-01T00:00:00Z', updatedAtUtc: '2024-01-01T00:00:00Z',
};

const PAGINATED: PaginatedResponse<ClientResponse> = { items: [MOCK_CLIENT], nextCursor: null };

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    service: TestBed.inject(ClientsApiService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('ClientsApiService', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    TestBed.resetTestingModule();
  });

  it('list() faz GET /clients e retorna paginação', async () => {
    const { service, http } = setup();
    const promise = service.list();
    http.expectOne(r => r.url.endsWith('/clients') && r.method === 'GET').flush(PAGINATED);
    const result = await promise;
    expect(result.items[0].name).toBe('Maria Souza');
  });

  it('list() envia cursor quando fornecido', async () => {
    const { service, http } = setup();
    const promise = service.list('cursor-xyz');
    const req = http.expectOne(r => r.url.includes('/clients'));
    expect(req.request.params.get('cursor')).toBe('cursor-xyz');
    req.flush(PAGINATED);
    await promise;
  });

  it('create() faz POST /clients com payload correto', async () => {
    const { service, http } = setup();
    const payload = { name: 'Fernanda', phone: '11888888888', email: '', notes: '' };
    const promise = service.create(payload);
    const req = http.expectOne(r => r.url.endsWith('/clients') && r.method === 'POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...MOCK_CLIENT, ...payload, id: 'cli-2' });
    const result = await promise;
    expect(result.name).toBe('Fernanda');
  });

  it('create() lança ClientPhoneDuplicateError em 409 com code client.phone.duplicate', async () => {
    const { service, http } = setup();
    const promise = service.create({ name: 'Outro', phone: '11999999999', email: '', notes: '' });
    http.expectOne(r => r.url.endsWith('/clients') && r.method === 'POST').flush(
      { code: 'client.phone.duplicate', message: 'Já existe um cliente com esse telefone.' },
      { status: 409, statusText: 'Conflict' }
    );
    await expect(promise).rejects.toBeInstanceOf(ClientPhoneDuplicateError);
  });

  it('ClientPhoneDuplicateError tem mensagem em português', async () => {
    const { service, http } = setup();
    const promise = service.create({ name: 'Outro', phone: '11999999999', email: '', notes: '' });
    http.expectOne(r => r.url.includes('/clients')).flush(
      { code: 'client.phone.duplicate', message: 'Duplicado' },
      { status: 409, statusText: 'Conflict' }
    );
    try {
      await promise;
    } catch (err) {
      expect(err).toBeInstanceOf(ClientPhoneDuplicateError);
      expect((err as ClientPhoneDuplicateError).message).toContain('telefone');
    }
  });

  it('create() propaga outros erros sem converter', async () => {
    const { service, http } = setup();
    const promise = service.create({ name: '', phone: '', email: '', notes: '' });
    http.expectOne(r => r.url.includes('/clients')).flush(
      { code: 'validation.failed', message: 'Inválido' },
      { status: 400, statusText: 'Bad Request' }
    );
    await expect(promise).rejects.toBeInstanceOf(HttpErrorResponse);
  });

  it('update() faz PUT /clients/{id}', async () => {
    const { service, http } = setup();
    const payload = { name: 'Maria Atualizada', phone: '11999999999', email: '', notes: '' };
    const promise = service.update('cli-1', payload);
    const req = http.expectOne(r => r.url.endsWith('/clients/cli-1') && r.method === 'PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ ...MOCK_CLIENT, ...payload });
    const result = await promise;
    expect(result.name).toBe('Maria Atualizada');
  });

  it('update() também converte 409 client.phone.duplicate em ClientPhoneDuplicateError', async () => {
    const { service, http } = setup();
    const promise = service.update('cli-1', { name: 'M', phone: '11888888888', email: '', notes: '' });
    http.expectOne(r => r.url.includes('/clients/cli-1') && r.method === 'PUT').flush(
      { code: 'client.phone.duplicate', message: 'Duplicado' },
      { status: 409, statusText: 'Conflict' }
    );
    await expect(promise).rejects.toBeInstanceOf(ClientPhoneDuplicateError);
  });

  it('deactivate() faz POST /clients/{id}/deactivate', async () => {
    const { service, http } = setup();
    const promise = service.deactivate('cli-1');
    http.expectOne(r => r.url.endsWith('/clients/cli-1/deactivate') && r.method === 'POST')
      .flush(null, { status: 204, statusText: 'No Content' });
    await expect(promise).resolves.toBeUndefined();
  });
});

// ─── ClientPhoneDuplicateError ────────────────────────────────────────────────

describe('ClientPhoneDuplicateError', () => {
  it('é instância de Error', () => {
    expect(new ClientPhoneDuplicateError()).toBeInstanceOf(Error);
  });

  it('tem name ClientPhoneDuplicateError', () => {
    expect(new ClientPhoneDuplicateError().name).toBe('ClientPhoneDuplicateError');
  });

  it('mensagem menciona telefone e salão', () => {
    const msg = new ClientPhoneDuplicateError().message;
    expect(msg).toContain('telefone');
    expect(msg).toContain('salão');
  });
});
