import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { SalonBlockResponse, CreateSalonBlockRequest, PaginatedResponse } from '../../core/api/api.models';

@Injectable({ providedIn: 'root' })
export class SalonBlocksApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(cursor?: string): Promise<PaginatedResponse<SalonBlockResponse>> {
    const params: Record<string, string> = cursor ? { cursor } : {};
    return firstValueFrom(
      this.http.get<PaginatedResponse<SalonBlockResponse>>(`${this.base}/salon-blocks`, { params })
    );
  }

  create(req: CreateSalonBlockRequest): Promise<SalonBlockResponse> {
    return firstValueFrom(
      this.http.post<SalonBlockResponse>(`${this.base}/salon-blocks`, req)
    );
  }

  delete(id: string): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(`${this.base}/salon-blocks/${id}`)
    ).then(() => undefined);
  }
}
