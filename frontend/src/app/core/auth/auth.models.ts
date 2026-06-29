export type CollaboratorRole = 'administradora' | 'profissional';

export interface TokenResponse {
  accessToken: string;
  expiresAtUtc: string;
}

export interface MeResponse {
  collaboratorId: string;
  tenantId: string;
  professionalId: string | null;
  role: CollaboratorRole;
  status: 'active' | 'inactive';
}

export interface LoginRequest {
  email: string;
  password: string;
}
