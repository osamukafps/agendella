import { Injectable } from '@angular/core';
import type { LoginRequest, MeResponse, TokenResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  // Implemented in T120 — stub exists for type-safety and DI registration
  login(_credentials: LoginRequest): Promise<TokenResponse> {
    return Promise.reject(new Error('AuthApiService.login not implemented'));
  }

  logout(): Promise<void> {
    return Promise.reject(new Error('AuthApiService.logout not implemented'));
  }

  refresh(): Promise<TokenResponse> {
    return Promise.reject(new Error('AuthApiService.refresh not implemented'));
  }

  me(): Promise<MeResponse> {
    return Promise.reject(new Error('AuthApiService.me not implemented'));
  }
}
