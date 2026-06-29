export type CollaboratorRole = 'administradora' | 'profissional';

export interface TokenResponse {
  accessToken: string;
  expiresAtUtc: string;
}

export interface MeResponse {
  collaboratorId: string;
  tenantId: string;
  professionalId: string | null;
  displayName: string;
  role: CollaboratorRole;
  status: 'active' | 'inactive';
  salonName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
