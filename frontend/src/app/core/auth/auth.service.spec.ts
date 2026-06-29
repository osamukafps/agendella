import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import type { AuthApiService } from './auth-api.service';
import type { MeResponse, TokenResponse } from './auth.models';

// ─── Fixtures ───────────────────────────────────────────────────────────────

const adminUser: MeResponse = {
  collaboratorId: 'collab-1',
  tenantId: 'tenant-1',
  professionalId: null,
  role: 'administradora',
  status: 'active',
};

const profissionalUser: MeResponse = {
  collaboratorId: 'collab-2',
  tenantId: 'tenant-1',
  professionalId: 'prof-1',
  role: 'profissional',
  status: 'active',
};

const testToken: TokenResponse = {
  accessToken: 'eyJhbGciOiJSUzI1NiJ9.test',
  expiresAtUtc: new Date(Date.now() + 3_600_000).toISOString(),
};

const refreshedToken: TokenResponse = {
  accessToken: 'eyJhbGciOiJSUzI1NiJ9.refreshed',
  expiresAtUtc: new Date(Date.now() + 3_600_000).toISOString(),
};

// ─── Mock factory ────────────────────────────────────────────────────────────

type MockAuthApi = {
  [K in keyof AuthApiService]: ReturnType<typeof vi.fn>;
};

function makeMockApi(): MockAuthApi {
  return {
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    me: vi.fn(),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let api: MockAuthApi;

  beforeEach(() => {
    api = makeMockApi();
    service = new AuthService(api as unknown as AuthApiService);
  });

  // ── Estado inicial ────────────────────────────────────────────────────────

  describe('estado inicial', () => {
    it('começa sem usuário autenticado', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('começa sem access token', () => {
      expect(service.accessToken()).toBeNull();
    });

    it('isAuthenticated retorna false', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('role retorna null', () => {
      expect(service.role()).toBeNull();
    });
  });

  // ── login() ───────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('define accessToken e currentUser após login bem-sucedido como administradora', async () => {
      api.login.mockResolvedValueOnce(testToken);
      api.me.mockResolvedValueOnce(adminUser);

      await service.login('admin@salon.com', 'senha123');

      expect(service.accessToken()).toBe(testToken.accessToken);
      expect(service.currentUser()).toEqual(adminUser);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.role()).toBe('administradora');
    });

    it('define role correta para profissional', async () => {
      api.login.mockResolvedValueOnce(testToken);
      api.me.mockResolvedValueOnce(profissionalUser);

      await service.login('prof@salon.com', 'senha123');

      expect(service.role()).toBe('profissional');
      expect(service.currentUser()?.professionalId).toBe('prof-1');
    });

    it('chama authApi.login com as credenciais corretas', async () => {
      api.login.mockResolvedValueOnce(testToken);
      api.me.mockResolvedValueOnce(adminUser);

      await service.login('admin@salon.com', 'senha123');

      expect(api.login).toHaveBeenCalledWith({ email: 'admin@salon.com', password: 'senha123' });
    });

    it('chama authApi.me após receber o token', async () => {
      api.login.mockResolvedValueOnce(testToken);
      api.me.mockResolvedValueOnce(adminUser);

      await service.login('admin@salon.com', 'senha123');

      expect(api.me).toHaveBeenCalledOnce();
    });

    it('não altera estado quando login falha', async () => {
      api.login.mockRejectedValueOnce(new Error('401 Unauthorized'));

      await expect(service.login('errado@email.com', 'errada')).rejects.toThrow();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(service.accessToken()).toBeNull();
    });

    it('não altera estado quando /me falha após login', async () => {
      api.login.mockResolvedValueOnce(testToken);
      api.me.mockRejectedValueOnce(new Error('503 Service Unavailable'));

      await expect(service.login('admin@salon.com', 'senha123')).rejects.toThrow();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });
  });

  // ── logout() ─────────────────────────────────────────────────────────────

  describe('logout()', () => {
    beforeEach(async () => {
      api.login.mockResolvedValueOnce(testToken);
      api.me.mockResolvedValueOnce(adminUser);
      await service.login('admin@salon.com', 'senha123');
    });

    it('limpa currentUser, accessToken e isAuthenticated', async () => {
      api.logout.mockResolvedValueOnce(undefined);

      await service.logout();

      expect(service.currentUser()).toBeNull();
      expect(service.accessToken()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.role()).toBeNull();
    });

    it('limpa estado mesmo quando a chamada de API falha', async () => {
      api.logout.mockRejectedValueOnce(new Error('Network Error'));

      await service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });

    it('não rejeita a promise quando API falha', async () => {
      api.logout.mockRejectedValueOnce(new Error('Network Error'));

      await expect(service.logout()).resolves.toBeUndefined();
    });
  });

  // ── refresh() ────────────────────────────────────────────────────────────

  describe('refresh()', () => {
    it('atualiza o accessToken com o novo token', async () => {
      api.refresh.mockResolvedValueOnce(refreshedToken);

      await service.refresh();

      expect(service.accessToken()).toBe(refreshedToken.accessToken);
    });

    it('limpa estado quando o refresh falha (cookie expirado)', async () => {
      api.login.mockResolvedValueOnce(testToken);
      api.me.mockResolvedValueOnce(adminUser);
      await service.login('admin@salon.com', 'senha123');

      api.refresh.mockRejectedValueOnce(new Error('401 Unauthorized'));

      await service.refresh();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(service.accessToken()).toBeNull();
    });

    it('não rejeita a promise quando o refresh falha', async () => {
      api.refresh.mockRejectedValueOnce(new Error('401 Unauthorized'));

      await expect(service.refresh()).resolves.toBeUndefined();
    });

    it('não altera currentUser ao fazer refresh com sucesso', async () => {
      api.login.mockResolvedValueOnce(testToken);
      api.me.mockResolvedValueOnce(adminUser);
      await service.login('admin@salon.com', 'senha123');

      api.refresh.mockResolvedValueOnce(refreshedToken);

      await service.refresh();

      expect(service.currentUser()).toEqual(adminUser);
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  // ── loadMe() ─────────────────────────────────────────────────────────────

  describe('loadMe()', () => {
    it('restaura sessão via cookie de refresh no bootstrap da app', async () => {
      api.refresh.mockResolvedValueOnce(testToken);
      api.me.mockResolvedValueOnce(adminUser);

      await service.loadMe();

      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentUser()).toEqual(adminUser);
      expect(service.accessToken()).toBe(testToken.accessToken);
    });

    it('permanece desautenticado se não houver cookie de sessão', async () => {
      api.refresh.mockRejectedValueOnce(new Error('401 Unauthorized'));

      await service.loadMe();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });

    it('não rejeita a promise quando não há sessão', async () => {
      api.refresh.mockRejectedValueOnce(new Error('401 Unauthorized'));

      await expect(service.loadMe()).resolves.toBeUndefined();
    });

    it('permanece desautenticado se /me falhar após refresh bem-sucedido', async () => {
      api.refresh.mockResolvedValueOnce(testToken);
      api.me.mockRejectedValueOnce(new Error('503 Unavailable'));

      await service.loadMe();

      expect(service.isAuthenticated()).toBe(false);
    });
  });

  // ── signals reativos ─────────────────────────────────────────────────────

  describe('reatividade dos signals', () => {
    it('isAuthenticated muda de false para true após login', async () => {
      expect(service.isAuthenticated()).toBe(false);

      api.login.mockResolvedValueOnce(testToken);
      api.me.mockResolvedValueOnce(adminUser);
      await service.login('admin@salon.com', 'senha123');

      expect(service.isAuthenticated()).toBe(true);
    });

    it('isAuthenticated muda de true para false após logout', async () => {
      api.login.mockResolvedValueOnce(testToken);
      api.me.mockResolvedValueOnce(adminUser);
      await service.login('admin@salon.com', 'senha123');

      api.logout.mockResolvedValueOnce(undefined);
      await service.logout();

      expect(service.isAuthenticated()).toBe(false);
    });
  });
});
