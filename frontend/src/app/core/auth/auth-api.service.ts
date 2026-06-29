import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { LoginRequest, MeResponse, TokenResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  login(credentials: LoginRequest): Promise<TokenResponse> {
    return firstValueFrom(
      this.http.post<TokenResponse>(`${this.base}/auth/login`, credentials, {
        withCredentials: true,
      })
    );
  }

  logout(): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.base}/auth/logout`, null, {
        withCredentials: true,
        headers: { 'X-CSRF-Protection': '1' },
      })
    ).then(() => undefined);
  }

  refresh(): Promise<TokenResponse> {
    return firstValueFrom(
      this.http.post<TokenResponse>(`${this.base}/auth/refresh`, null, {
        withCredentials: true,
        headers: { 'X-CSRF-Protection': '1' },
      })
    );
  }

  me(): Promise<MeResponse> {
    return firstValueFrom(
      this.http.get<MeResponse>(`${this.base}/me`)
    );
  }
}
