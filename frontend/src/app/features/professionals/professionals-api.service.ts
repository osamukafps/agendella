import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ProfessionalResponse,
  CreateProfessionalRequest,
  UpdateProfessionalRequest,
  WeeklyAvailabilityResponse,
  ReplaceWeeklyAvailabilityRequest,
  WeeklyAvailabilityEntryDto,
  PaginatedResponse,
} from '../../core/api/api.models';

@Injectable({ providedIn: 'root' })
export class ProfessionalsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(cursor?: string, pageSize?: number): Promise<PaginatedResponse<ProfessionalResponse>> {
    const params: Record<string, string> = {};
    if (cursor) params['cursor'] = cursor;
    if (pageSize) params['pageSize'] = String(pageSize);
    return firstValueFrom(
      this.http.get<PaginatedResponse<ProfessionalResponse>>(`${this.base}/professionals`, { params })
    );
  }

  get(id: string): Promise<ProfessionalResponse> {
    return firstValueFrom(this.http.get<ProfessionalResponse>(`${this.base}/professionals/${id}`));
  }

  create(req: CreateProfessionalRequest): Promise<ProfessionalResponse> {
    return firstValueFrom(this.http.post<ProfessionalResponse>(`${this.base}/professionals`, req));
  }

  update(id: string, req: UpdateProfessionalRequest): Promise<ProfessionalResponse> {
    return firstValueFrom(this.http.put<ProfessionalResponse>(`${this.base}/professionals/${id}`, req));
  }

  deactivate(id: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/professionals/${id}/deactivate`, null)
    ).then(() => undefined);
  }

  getWeeklyAvailability(professionalId: string): Promise<WeeklyAvailabilityEntryDto[]> {
    return firstValueFrom(
      this.http.get<WeeklyAvailabilityResponse>(
        `${this.base}/professionals/${professionalId}/weekly-availability`
      )
    ).then(r => r.slots);
  }

  updateWeeklyAvailability(
    professionalId: string,
    slots: WeeklyAvailabilityEntryDto[]
  ): Promise<WeeklyAvailabilityEntryDto[]> {
    const req: ReplaceWeeklyAvailabilityRequest = { slots };
    return firstValueFrom(
      this.http.put<WeeklyAvailabilityResponse>(
        `${this.base}/professionals/${professionalId}/weekly-availability`,
        req
      )
    ).then(r => r.slots);
  }
}
