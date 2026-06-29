import { describe, it, expect, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import {
  AppShellComponent,
  ALL_NAV_ITEMS,
  getNavItemsForRole,
} from './app-shell.component';
import { AuthService } from '../auth/auth.service';
import type { CollaboratorRole } from '../auth/auth.models';
import type { MeResponse } from '../auth/auth.models';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const adminUser: MeResponse = {
  collaboratorId: 'collab-1',
  tenantId: 'tenant-1',
  professionalId: null,
  role: 'administradora',
  status: 'active',
};

const professionalUser: MeResponse = {
  collaboratorId: 'collab-2',
  tenantId: 'tenant-1',
  professionalId: 'prof-1',
  role: 'profissional',
  status: 'active',
};

// ─── Pure function: getNavItemsForRole ────────────────────────────────────────

describe('getNavItemsForRole()', () => {
  it('retorna 4 itens para administradora', () => {
    expect(getNavItemsForRole('administradora')).toHaveLength(4);
  });

  it('retorna Agenda para administradora', () => {
    const items = getNavItemsForRole('administradora');
    expect(items.find(i => i.id === 'agenda')).toBeDefined();
  });

  it('retorna Clientes para administradora', () => {
    const items = getNavItemsForRole('administradora');
    expect(items.find(i => i.id === 'clientes')).toBeDefined();
  });

  it('retorna Serviços para administradora', () => {
    const items = getNavItemsForRole('administradora');
    expect(items.find(i => i.id === 'servicos')).toBeDefined();
  });

  it('retorna Perfil para administradora', () => {
    const items = getNavItemsForRole('administradora');
    expect(items.find(i => i.id === 'perfil')).toBeDefined();
  });

  it('retorna 3 itens para profissional', () => {
    expect(getNavItemsForRole('profissional')).toHaveLength(3);
  });

  it('não inclui Serviços para profissional', () => {
    const items = getNavItemsForRole('profissional');
    expect(items.find(i => i.id === 'servicos')).toBeUndefined();
  });

  it('inclui Agenda para profissional', () => {
    const items = getNavItemsForRole('profissional');
    expect(items.find(i => i.id === 'agenda')).toBeDefined();
  });

  it('inclui Clientes para profissional', () => {
    const items = getNavItemsForRole('profissional');
    expect(items.find(i => i.id === 'clientes')).toBeDefined();
  });

  it('inclui Perfil para profissional', () => {
    const items = getNavItemsForRole('profissional');
    expect(items.find(i => i.id === 'perfil')).toBeDefined();
  });

  it('retorna lista vazia quando role é null', () => {
    expect(getNavItemsForRole(null)).toHaveLength(0);
  });

  it('todos os itens têm id, label e route definidos', () => {
    const items = getNavItemsForRole('administradora');
    items.forEach(item => {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.route).toMatch(/^\//);
    });
  });
});

// ─── ALL_NAV_ITEMS definição ──────────────────────────────────────────────────

describe('ALL_NAV_ITEMS', () => {
  it('tem exatamente 4 itens de navegação', () => {
    expect(ALL_NAV_ITEMS).toHaveLength(4);
  });

  it('nenhum item tem roles vazio', () => {
    ALL_NAV_ITEMS.forEach(item => {
      expect(item.roles.length).toBeGreaterThan(0);
    });
  });

  it('Serviços é restrito a administradora', () => {
    const servicos = ALL_NAV_ITEMS.find(i => i.id === 'servicos');
    expect(servicos?.roles).toEqual(['administradora']);
  });
});

// ─── AppShellComponent.navItems signal ───────────────────────────────────────

function setupShell(role: CollaboratorRole | null, user: MeResponse | null = null) {
  const roleSig = signal<CollaboratorRole | null>(role);
  const userSig = signal<MeResponse | null>(user);

  TestBed.configureTestingModule({
    imports: [AppShellComponent],
    providers: [
      provideRouter([]),
      {
        provide: AuthService,
        useValue: {
          role: roleSig.asReadonly(),
          currentUser: userSig.asReadonly(),
          isAuthenticated: signal(role !== null).asReadonly(),
          accessToken: signal<string | null>(null).asReadonly(),
        },
      },
    ],
  });

  const fixture = TestBed.createComponent(AppShellComponent);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('AppShellComponent.navItems (signal)', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('retorna 4 itens para administradora', () => {
    const shell = setupShell('administradora', adminUser);
    expect(shell.navItems()).toHaveLength(4);
  });

  it('retorna 3 itens para profissional', () => {
    const shell = setupShell('profissional', professionalUser);
    expect(shell.navItems()).toHaveLength(3);
  });

  it('não inclui Serviços para profissional', () => {
    const shell = setupShell('profissional', professionalUser);
    expect(shell.navItems().find(i => i.id === 'servicos')).toBeUndefined();
  });

  it('retorna lista vazia sem role (usuário deslogado)', () => {
    const shell = setupShell(null, null);
    expect(shell.navItems()).toHaveLength(0);
  });

  it('expõe currentUser da AuthService', () => {
    const shell = setupShell('administradora', adminUser);
    expect(shell.currentUser()).toEqual(adminUser);
  });
});
