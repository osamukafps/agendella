import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { of, throwError, firstValueFrom, catchError } from 'rxjs';
import { signal } from '@angular/core';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../auth/auth.service';
import type { HttpHandlerFn } from '@angular/common/http';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GET = (url: string) => new HttpRequest('GET', url);
const ok = () => of(new HttpResponse<unknown>({ status: 200, body: {} }));
const unauthorized = () =>
  throwError(() => new HttpErrorResponse({ status: 401, url: '/api/test' }));
const serverError = () =>
  throwError(() => new HttpErrorResponse({ status: 500, url: '/api/test' }));

type SetupResult = {
  tokenSignal: ReturnType<typeof signal<string | null>>;
  mockRefresh: ReturnType<typeof vi.fn>;
};

function setup(initialToken: string | null = null): SetupResult {
  const tokenSignal = signal<string | null>(initialToken);
  const mockRefresh = vi.fn();

  TestBed.configureTestingModule({
    providers: [
      {
        provide: AuthService,
        useValue: { accessToken: tokenSignal, refresh: mockRefresh },
      },
    ],
  });

  return { tokenSignal, mockRefresh };
}

function intercept(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  return TestBed.runInInjectionContext(() => authInterceptor(req, next));
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('authInterceptor', () => {
  afterEach(() => TestBed.resetTestingModule());

  // ── Token no header ───────────────────────────────────────────────────────

  describe('cabeçalho Authorization', () => {
    it('não adiciona Authorization quando não há token', async () => {
      setup(null);
      const mockNext = vi.fn().mockReturnValue(ok());

      await firstValueFrom(intercept(GET('/api/salon'), mockNext));

      const sent = mockNext.mock.calls[0][0] as HttpRequest<unknown>;
      expect(sent.headers.has('Authorization')).toBe(false);
    });

    it('adiciona Authorization: Bearer {token} quando autenticado', async () => {
      setup('access-token-123');
      const mockNext = vi.fn().mockReturnValue(ok());

      await firstValueFrom(intercept(GET('/api/salon'), mockNext));

      const sent = mockNext.mock.calls[0][0] as HttpRequest<unknown>;
      expect(sent.headers.get('Authorization')).toBe('Bearer access-token-123');
    });

    it('não modifica outros headers existentes na requisição', async () => {
      setup('my-token');
      const req = new HttpRequest('POST', '/api/appointments', {}, {
        headers: new (await import('@angular/common/http')).HttpHeaders({
          'Content-Type': 'application/json',
        }),
      });
      const mockNext = vi.fn().mockReturnValue(ok());

      await firstValueFrom(intercept(req, mockNext));

      const sent = mockNext.mock.calls[0][0] as HttpRequest<unknown>;
      expect(sent.headers.get('Content-Type')).toBe('application/json');
      expect(sent.headers.get('Authorization')).toBe('Bearer my-token');
    });
  });

  // ── Retry em 401 ─────────────────────────────────────────────────────────

  describe('retry após 401', () => {
    it('tenta refresh e repete a requisição com novo token', async () => {
      const { tokenSignal, mockRefresh } = setup('old-token');

      mockRefresh.mockImplementation(async () => {
        tokenSignal.set('new-token');
      });

      const mockNext = vi.fn()
        .mockReturnValueOnce(unauthorized())
        .mockReturnValueOnce(ok());

      await firstValueFrom(intercept(GET('/api/salon'), mockNext));

      expect(mockRefresh).toHaveBeenCalledOnce();
      expect(mockNext).toHaveBeenCalledTimes(2);

      const retryReq = mockNext.mock.calls[1][0] as HttpRequest<unknown>;
      expect(retryReq.headers.get('Authorization')).toBe('Bearer new-token');
    });

    it('propaga o erro 401 quando o refresh falha', async () => {
      const { mockRefresh } = setup('my-token');
      mockRefresh.mockRejectedValueOnce(new Error('Cookie expirado'));

      const mockNext = vi.fn().mockReturnValue(unauthorized());

      await expect(
        firstValueFrom(intercept(GET('/api/salon'), mockNext))
      ).rejects.toBeInstanceOf(HttpErrorResponse);
    });

    it('faz exatamente uma tentativa de refresh por falha 401', async () => {
      const { mockRefresh } = setup('my-token');
      mockRefresh.mockRejectedValueOnce(new Error('Expirado'));

      const mockNext = vi.fn().mockReturnValue(unauthorized());

      await expect(
        firstValueFrom(intercept(GET('/api/salon'), mockNext))
      ).rejects.toThrow();

      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  // ── Sem retry em casos específicos ───────────────────────────────────────

  describe('sem retry em casos especiais', () => {
    it('não tenta refresh em endpoints /auth/ (evita loop infinito)', async () => {
      const { mockRefresh } = setup('my-token');
      const mockNext = vi.fn().mockReturnValue(unauthorized());

      await expect(
        firstValueFrom(intercept(GET('/auth/refresh'), mockNext))
      ).rejects.toThrow();

      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('não tenta refresh em erro 401 em /auth/login', async () => {
      const { mockRefresh } = setup(null);
      const mockNext = vi.fn().mockReturnValue(unauthorized());

      await expect(
        firstValueFrom(intercept(GET('/auth/login'), mockNext))
      ).rejects.toThrow();

      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('passa erros não-401 diretamente sem tentar refresh', async () => {
      const { mockRefresh } = setup('my-token');
      const mockNext = vi.fn().mockReturnValue(serverError());

      await expect(
        firstValueFrom(intercept(GET('/api/salon'), mockNext))
      ).rejects.toBeInstanceOf(HttpErrorResponse);

      expect(mockRefresh).not.toHaveBeenCalled();
    });

    it('propaga erro 5xx com o status correto', async () => {
      setup('my-token');
      const mockNext = vi.fn().mockReturnValue(serverError());

      const error = await firstValueFrom(
        intercept(GET('/api/salon'), mockNext).pipe(
          catchError((e) => of(e))
        )
      );

      expect((error as HttpErrorResponse).status).toBe(500);
    });
  });

  // ── Resposta bem-sucedida ─────────────────────────────────────────────────

  describe('resposta bem-sucedida', () => {
    it('passa a resposta da API sem modificações', async () => {
      setup('my-token');
      const body = { id: '123', name: 'Salão da Ana' };
      const mockNext = vi.fn().mockReturnValue(
        of(new HttpResponse({ status: 200, body }))
      );

      const response = await firstValueFrom(
        intercept(GET('/api/salon'), mockNext)
      );

      expect((response as HttpResponse<unknown>).body).toEqual(body);
    });
  });
});
