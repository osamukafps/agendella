import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { signal } from '@angular/core';
import { authGuard, adminGuard, professionalGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type { CollaboratorRole } from './auth.models';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MOCK_ROUTE = {} as ActivatedRouteSnapshot;
const MOCK_STATE = { url: '/agenda' } as RouterStateSnapshot;

function setupAuth(opts: {
  isAuthenticated: boolean;
  role?: CollaboratorRole | null;
}) {
  const isAuthSig = signal(opts.isAuthenticated);
  const roleSig = signal<CollaboratorRole | null>(opts.role ?? null);

  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          isAuthenticated: isAuthSig.asReadonly(),
          role: roleSig.asReadonly(),
        },
      },
    ],
  });

  return { isAuthSig, roleSig };
}

function run<T>(guardFn: () => T): T {
  return TestBed.runInInjectionContext(guardFn);
}

// ─── authGuard ───────────────────────────────────────────────────────────────

describe('authGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('retorna true quando o usuário está autenticado como administradora', () => {
    setupAuth({ isAuthenticated: true, role: 'administradora' });

    const result = run(() => authGuard(MOCK_ROUTE, MOCK_STATE));

    expect(result).toBe(true);
  });

  it('retorna true quando o usuário está autenticado como profissional', () => {
    setupAuth({ isAuthenticated: true, role: 'profissional' });

    const result = run(() => authGuard(MOCK_ROUTE, MOCK_STATE));

    expect(result).toBe(true);
  });

  it('retorna UrlTree quando não autenticado', () => {
    setupAuth({ isAuthenticated: false });

    const result = run(() => authGuard(MOCK_ROUTE, MOCK_STATE));

    expect(result).toBeInstanceOf(UrlTree);
  });

  it('redireciona para /login quando não autenticado', () => {
    setupAuth({ isAuthenticated: false });

    const result = run(() => authGuard(MOCK_ROUTE, MOCK_STATE));
    const router = TestBed.inject(Router);

    expect(result).toEqual(router.createUrlTree(['/login']));
  });
});

// ─── adminGuard ──────────────────────────────────────────────────────────────

describe('adminGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('retorna true para administradora', () => {
    setupAuth({ isAuthenticated: true, role: 'administradora' });

    const result = run(() => adminGuard(MOCK_ROUTE, MOCK_STATE));

    expect(result).toBe(true);
  });

  it('redireciona profissional para /agenda', () => {
    setupAuth({ isAuthenticated: true, role: 'profissional' });

    const result = run(() => adminGuard(MOCK_ROUTE, MOCK_STATE));
    const router = TestBed.inject(Router);

    expect(result).toEqual(router.createUrlTree(['/agenda']));
  });

  it('redireciona usuário sem role para /agenda', () => {
    setupAuth({ isAuthenticated: false, role: null });

    const result = run(() => adminGuard(MOCK_ROUTE, MOCK_STATE));
    const router = TestBed.inject(Router);

    expect(result).toEqual(router.createUrlTree(['/agenda']));
  });

  it('retorna UrlTree (nunca boolean) quando acesso negado', () => {
    setupAuth({ isAuthenticated: true, role: 'profissional' });

    const result = run(() => adminGuard(MOCK_ROUTE, MOCK_STATE));

    expect(result).toBeInstanceOf(UrlTree);
    expect(result).not.toBe(false);
  });
});

// ─── professionalGuard ───────────────────────────────────────────────────────

describe('professionalGuard', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('retorna true para profissional', () => {
    setupAuth({ isAuthenticated: true, role: 'profissional' });

    const result = run(() => professionalGuard(MOCK_ROUTE, MOCK_STATE));

    expect(result).toBe(true);
  });

  it('redireciona administradora para /agenda', () => {
    setupAuth({ isAuthenticated: true, role: 'administradora' });

    const result = run(() => professionalGuard(MOCK_ROUTE, MOCK_STATE));
    const router = TestBed.inject(Router);

    expect(result).toEqual(router.createUrlTree(['/agenda']));
  });

  it('redireciona usuário não autenticado para /agenda', () => {
    setupAuth({ isAuthenticated: false, role: null });

    const result = run(() => professionalGuard(MOCK_ROUTE, MOCK_STATE));

    expect(result).toBeInstanceOf(UrlTree);
  });
});
