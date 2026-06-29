import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  AppointmentResponse,
  AvailabilityResponse,
  CreateAppointmentRequest,
  RescheduleAppointmentRequest,
  PaginatedResponse,
} from '../../core/api/api.models';

export class AppointmentConflictError extends Error {
  constructor(
    public readonly conflictType: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(`Conflito de agendamento: ${conflictType}`);
    this.name = 'AppointmentConflictError';
  }
}

function toConflictError(err: unknown): never {
  if (
    err instanceof HttpErrorResponse &&
    err.status === 409 &&
    err.error?.code === 'appointment.conflict'
  ) {
    throw new AppointmentConflictError(
      err.error.details?.conflictType ?? 'unknown',
      err.error.details,
    );
  }
  throw err;
}

@Injectable({ providedIn: 'root' })
export class AgendaApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(params?: { pageSize?: number; cursor?: string }): Promise<PaginatedResponse<AppointmentResponse>> {
    const p: Record<string, string> = {};
    if (params?.pageSize) p['pageSize'] = String(params.pageSize);
    if (params?.cursor)   p['cursor']   = params.cursor;
    return firstValueFrom(
      this.http.get<PaginatedResponse<AppointmentResponse>>(`${this.base}/appointments`, { params: p })
    );
  }

  getById(id: string): Promise<AppointmentResponse> {
    return firstValueFrom(this.http.get<AppointmentResponse>(`${this.base}/appointments/${id}`));
  }

  searchAvailability(
    professionalId: string,
    date: string,
    durationMinutes: number,
  ): Promise<AvailabilityResponse> {
    return firstValueFrom(
      this.http.get<AvailabilityResponse>(`${this.base}/availability`, {
        params: { professionalId, date, durationMinutes: String(durationMinutes) },
      })
    );
  }

  create(req: CreateAppointmentRequest): Promise<AppointmentResponse> {
    return firstValueFrom(
      this.http.post<AppointmentResponse>(`${this.base}/appointments`, req)
    ).catch(toConflictError);
  }

  reschedule(id: string, req: RescheduleAppointmentRequest): Promise<AppointmentResponse> {
    return firstValueFrom(
      this.http.post<AppointmentResponse>(`${this.base}/appointments/${id}/reschedule`, req)
    ).catch(toConflictError);
  }

  cancel(id: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/appointments/${id}/cancel`, null)
    ).then(() => undefined);
  }

  complete(id: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/appointments/${id}/complete`, null)
    ).then(() => undefined);
  }

  noShow(id: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/appointments/${id}/no-show`, null)
    ).then(() => undefined);
  }

  resolveReview(id: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/appointments/${id}/resolve-review`, null)
    ).then(() => undefined);
  }
}
