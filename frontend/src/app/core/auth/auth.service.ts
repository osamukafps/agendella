import { Injectable, computed, signal } from '@angular/core';
import type { CollaboratorRole, MeResponse } from './auth.models';
import { AuthApiService } from './auth-api.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<MeResponse | null>(null);
  private readonly _accessToken = signal<string | null>(null);

  readonly currentUser = this._currentUser.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly role = computed<CollaboratorRole | null>(() => this._currentUser()?.role ?? null);

  constructor(private readonly authApi: AuthApiService) {}

  async login(email: string, password: string): Promise<void> {
    const token = await this.authApi.login({ email, password });
    this._accessToken.set(token.accessToken);
    const user = await this.authApi.me();
    this._currentUser.set(user);
  }

  async logout(): Promise<void> {
    try {
      await this.authApi.logout();
    } catch {
      // Erros de rede no logout são silenciosos — estado local limpo de qualquer forma
    }
    this._clear();
  }

  async refresh(): Promise<void> {
    try {
      const token = await this.authApi.refresh();
      this._accessToken.set(token.accessToken);
    } catch {
      this._clear();
    }
  }

  // Called on app bootstrap — tries to silently restore session via refresh cookie
  async loadMe(): Promise<void> {
    try {
      const token = await this.authApi.refresh();
      this._accessToken.set(token.accessToken);
      const user = await this.authApi.me();
      this._currentUser.set(user);
    } catch {
      // No active session — stay unauthenticated
    }
  }

  private _clear(): void {
    this._currentUser.set(null);
    this._accessToken.set(null);
  }
}
