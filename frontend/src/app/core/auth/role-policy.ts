import type { CollaboratorRole } from './auth.models';

export const rolePolicies = {
  adminOnly: ['administradora'],
  professionalOnly: ['profissional'],
  authenticated: ['administradora', 'profissional']
} as const satisfies Record<string, CollaboratorRole[]>;
