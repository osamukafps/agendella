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
  it('retorna 5 itens para administradora (Agenda, Clientes, Serviços, Equipe, Bloqueios)', () => {
    expect(getNavItemsForRole('administradora')).toHaveLength(5);
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

  it('retorna Equipe (profissionais) para administradora', () => {
    const items = getNavItemsForRole('administradora');
    expect(items.find(i => i.id === 'profissionais')).toBeDefined();
  });

  it('retorna Bloqueios para administradora', () => {
    const items = getNavItemsForRole('administradora');
    expect(items.find(i => i.id === 'bloqueios')).toBeDefined();
  });

  it('não inclui Ausências para administradora', () => {
    const items = getNavItemsForRole('administradora');
    expect(items.find(i => i.id === 'ausencias')).toBeUndefined();
  });

  it('retorna 4 itens para profissional (Agenda, Clientes, Disponibilidade, Ausências)', () => {
    expect(getNavItemsForRole('profissional')).toHaveLength(4);
  });

  it('não inclui Serviços para profissional', () => {
    const items = getNavItemsForRole('profissional');
    expect(items.find(i => i.id === 'servicos')).toBeUndefined();
  });

  it('não inclui Bloqueios para profissional', () => {
    const items = getNavItemsForRole('profissional');
    expect(items.find(i => i.id === 'bloqueios')).toBeUndefined();
  });

  it('não inclui Profissionais para profissional', () => {
    const items = getNavItemsForRole('profissional');
    expect(items.find(i => i.id === 'profissionais')).toBeUndefined();
  });

  it('inclui Disponibilidade para profissional', () => {
    const items = getNavItemsForRole('profissional');
    expect(items.find(i => i.id === 'disponibilidade')).toBeDefined();
  });

  it('inclui Ausências para profissional', () => {
    const items = getNavItemsForRole('profissional');
    expect(items.find(i => i.id === 'ausencias')).toBeDefined();
  });

  it('inclui Agenda para profissional', () => {
    const items = getNavItemsForRole('profissional');
    expect(items.find(i => i.id === 'agenda')).toBeDefined();
  });

  it('inclui Clientes para profissional', () => {
    const items = getNavItemsForRole('profissional');
    expect(items.find(i => i.id === 'clientes')).toBeDefined();
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
  it('tem exatamente 7 itens de navegação', () => {
    expect(ALL_NAV_ITEMS).toHaveLength(7);
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

  it('Profissionais é restrito à administradora', () => {
    const prof = ALL_NAV_ITEMS.find(i => i.id === 'profissionais');
    expect(prof?.roles).toEqual(['administradora']);
  });

  it('Bloqueios é restrito à administradora', () => {
    const bloqueios = ALL_NAV_ITEMS.find(i => i.id === 'bloqueios');
    expect(bloqueios?.roles).toEqual(['administradora']);
  });

  it('Disponibilidade é restrito ao profissional', () => {
    const disp = ALL_NAV_ITEMS.find(i => i.id === 'disponibilidade');
    expect(disp?.roles).toEqual(['profissional']);
  });

  it('Ausências é restrito ao profissional', () => {
    const ausencias = ALL_NAV_ITEMS.find(i => i.id === 'ausencias');
    expect(ausencias?.roles).toEqual(['profissional']);
  });

  it('Agenda e Clientes são acessíveis a ambos os roles', () => {
    const allRoles = ['administradora', 'profissional'] as CollaboratorRole[];
    ['agenda', 'clientes'].forEach(id => {
      const item = ALL_NAV_ITEMS.find(i => i.id === id)!;
      allRoles.forEach(role => {
        expect(item.roles).toContain(role);
      });
    });
  });

  it('itens têm ordem: Agenda → Clientes → Serviços → Equipe → Bloqueios → Disponibilidade → Ausências', () => {
    const ids = ALL_NAV_ITEMS.map(i => i.id);
    expect(ids).toEqual(['agenda', 'clientes', 'servicos', 'profissionais', 'bloqueios', 'disponibilidade', 'ausencias']);
  });
});
