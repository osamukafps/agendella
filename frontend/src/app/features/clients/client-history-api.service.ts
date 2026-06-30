import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ClientHistoryEventResponse, ClientResponse, PaginatedResponse } from '../../core/api/api.models';

@Injectable({ providedIn: 'root' })
export class ClientHistoryApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getClient(clientId: string): Promise<ClientResponse> {
    return firstValueFrom(this.http.get<ClientResponse>(`${this.base}/clients/${clientId}`));
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
}
