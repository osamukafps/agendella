import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ServiceResponse,
  CreateServiceRequest,
  UpdateServiceRequest,
  PaginatedResponse,
} from '../../core/api/api.models';

@Injectable({ providedIn: 'root' })
export class ServicesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(cursor?: string): Promise<PaginatedResponse<ServiceResponse>> {
    const params: Record<string, string> = cursor ? { cursor } : {};
    return firstValueFrom(
      this.http.get<PaginatedResponse<ServiceResponse>>(`${this.base}/services`, { params })
    );
  }

  get(id: string): Promise<ServiceResponse> {
    return firstValueFrom(this.http.get<ServiceResponse>(`${this.base}/services/${id}`));
  }

  create(req: CreateServiceRequest): Promise<ServiceResponse> {
    return firstValueFrom(this.http.post<ServiceResponse>(`${this.base}/services`, req));
  }

  update(id: string, req: UpdateServiceRequest): Promise<ServiceResponse> {
    return firstValueFrom(this.http.put<ServiceResponse>(`${this.base}/services/${id}`, req));
  }

  deactivate(id: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/services/${id}/deactivate`, null)
    ).then(() => undefined);
  }
}
