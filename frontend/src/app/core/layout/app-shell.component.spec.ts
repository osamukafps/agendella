import { describe, it, expect } from 'vitest';
import {
  ALL_NAV_ITEMS,
  getNavItemsForRole,
} from './app-shell.component';
import type { CollaboratorRole } from '../auth/auth.models';

// ─── Pure function: getNavItemsForRole ────────────────────────────────────────
// Os signals do componente (navItems, role, currentUser) são composições desta função.
// A integração completa é verificada em testes E2E / browser.

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

  it('todos os itens têm id, label e route válidos', () => {
    const items = getNavItemsForRole('administradora');
    items.forEach(item => {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(item.route).toMatch(/^\//);
    });
  });

  it('todos os itens têm pelo menos uma role autorizada', () => {
    getNavItemsForRole('administradora').forEach(item => {
      expect(item.roles.length).toBeGreaterThan(0);
    });
  });
});

// ─── ALL_NAV_ITEMS ────────────────────────────────────────────────────────────

describe('ALL_NAV_ITEMS', () => {
  it('tem exatamente 4 itens de navegação', () => {
    expect(ALL_NAV_ITEMS).toHaveLength(4);
  });

  it('nenhum item tem roles vazio', () => {
    ALL_NAV_ITEMS.forEach(item => {
      expect(item.roles.length).toBeGreaterThan(0);
    });
  });

  it('Serviços é restrito à administradora', () => {
    const servicos = ALL_NAV_ITEMS.find(i => i.id === 'servicos');
    expect(servicos?.roles).toEqual(['administradora']);
  });

  it('Agenda, Clientes e Perfil são acessíveis a ambos os roles', () => {
    const allRoles = ['administradora', 'profissional'] as CollaboratorRole[];
    ['agenda', 'clientes', 'perfil'].forEach(id => {
      const item = ALL_NAV_ITEMS.find(i => i.id === id)!;
      allRoles.forEach(role => {
        expect(item.roles).toContain(role);
      });
    });
  });

  it('itens têm ordem: Agenda → Clientes → Serviços → Perfil', () => {
    const ids = ALL_NAV_ITEMS.map(i => i.id);
    expect(ids).toEqual(['agenda', 'clientes', 'servicos', 'perfil']);
  });
});
