import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ClientResponse,
  CreateClientRequest,
  UpdateClientRequest,
  ClientHistoryEventResponse,
  PaginatedResponse,
} from '../../core/api/api.models';

export class ClientPhoneDuplicateError extends Error {
  constructor() {
    super('Já existe um cliente com este telefone neste salão.');
    this.name = 'ClientPhoneDuplicateError';
  }
}

@Injectable({ providedIn: 'root' })
export class ClientsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(cursor?: string, pageSize?: number): Promise<PaginatedResponse<ClientResponse>> {
    const params: Record<string, string> = {};
    if (cursor) params['cursor'] = cursor;
    if (pageSize) params['pageSize'] = String(pageSize);
    return firstValueFrom(
      this.http.get<PaginatedResponse<ClientResponse>>(`${this.base}/clients`, { params })
    );
  }

  get(id: string): Promise<ClientResponse> {
    return firstValueFrom(this.http.get<ClientResponse>(`${this.base}/clients/${id}`));
  }

  create(req: CreateClientRequest): Promise<ClientResponse> {
    return firstValueFrom(
      this.http.post<ClientResponse>(`${this.base}/clients`, req)
    ).catch(this.handlePhoneError);
  }

  update(id: string, req: UpdateClientRequest): Promise<ClientResponse> {
    return firstValueFrom(
      this.http.put<ClientResponse>(`${this.base}/clients/${id}`, req)
    ).catch(this.handlePhoneError);
  }

  deactivate(id: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/clients/${id}/deactivate`, null)
    ).then(() => undefined);
  }

  getHistory(
    clientId: string,
    cursor?: string,
    pageSize?: number,
  ): Promise<PaginatedResponse<ClientHistoryEventResponse>> {
    const params: Record<string, string> = {};
    if (cursor) params['cursor'] = cursor;
    if (pageSize) params['pageSize'] = String(pageSize);
    return firstValueFrom(
      this.http.get<PaginatedResponse<ClientHistoryEventResponse>>(
        `${this.base}/clients/${clientId}/history`,
        { params }
      )
    );
  }

  private handlePhoneError(err: unknown): never {
    if (
      err instanceof HttpErrorResponse &&
      err.status === 409 &&
      err.error?.code === 'client.phone.duplicate'
    ) {
      throw new ClientPhoneDuplicateError();
    }
    throw err;
  }
}
