import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  ProfessionalAbsenceResponse,
  CreateProfessionalAbsenceRequest,
  PaginatedResponse,
} from '../../core/api/api.models';

@Injectable({ providedIn: 'root' })
export class ProfessionalAbsencesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(professionalId: string, cursor?: string): Promise<PaginatedResponse<ProfessionalAbsenceResponse>> {
    const params: Record<string, string> = cursor ? { cursor } : {};
    return firstValueFrom(
      this.http.get<PaginatedResponse<ProfessionalAbsenceResponse>>(
        `${this.base}/professionals/${professionalId}/absences`,
        { params }
      )
    );
  }

  create(req: CreateProfessionalAbsenceRequest): Promise<ProfessionalAbsenceResponse> {
    return firstValueFrom(
      this.http.post<ProfessionalAbsenceResponse>(`${this.base}/professional-absences`, req)
    );
  }

  cancel(professionalId: string, absenceId: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(
        `${this.base}/professionals/${professionalId}/absences/${absenceId}/cancel`,
        null
      )
    ).then(() => undefined);
  }
}
