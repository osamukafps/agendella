import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  SalonSettingsResponse,
  UpdateSalonSettingsRequest,
  BusinessHourDto,
  ReplaceBusinessHoursRequest,
} from '../../core/api/api.models';

@Injectable({ providedIn: 'root' })
export class SalonSettingsApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getSettings(): Promise<SalonSettingsResponse> {
    return firstValueFrom(this.http.get<SalonSettingsResponse>(`${this.base}/salon`));
  }

  updateSettings(req: UpdateSalonSettingsRequest): Promise<SalonSettingsResponse> {
    return firstValueFrom(this.http.put<SalonSettingsResponse>(`${this.base}/salon`, req));
  }

  getBusinessHours(): Promise<BusinessHourDto[]> {
    return firstValueFrom(this.http.get<BusinessHourDto[]>(`${this.base}/salon/business-hours`));
  }

  updateBusinessHours(hours: BusinessHourDto[]): Promise<BusinessHourDto[]> {
    const req: ReplaceBusinessHoursRequest = { businessHours: hours };
    return firstValueFrom(this.http.put<BusinessHourDto[]>(`${this.base}/salon/business-hours`, req));
  }
}
