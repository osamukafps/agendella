import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import type { CollaboratorRole } from '../auth/auth.models';

export interface NavItem {
  id: string;
  label: string;
  route: string;
  roles: CollaboratorRole[];
}

export const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'agenda',          label: 'Agenda',          route: '/agenda',                roles: ['administradora', 'profissional'] },
  { id: 'clientes',        label: 'Clientes',        route: '/clientes',              roles: ['administradora', 'profissional'] },
  { id: 'servicos',        label: 'Serviços',        route: '/servicos',              roles: ['administradora'] },
  { id: 'disponibilidade', label: 'Disponível.',     route: '/minha-disponibilidade', roles: ['profissional'] },
  { id: 'perfil',          label: 'Perfil',          route: '/perfil',                roles: ['administradora', 'profissional'] },
];

export function getNavItemsForRole(role: CollaboratorRole | null): NavItem[] {
  if (!role) return [];
  return ALL_NAV_ITEMS.filter(item => item.roles.includes(role));
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly role        = this.authService.role;
  readonly navItems    = computed(() => getNavItemsForRole(this.authService.role()));

  readonly todayLabel = computed(() =>
    new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date())
  );

  readonly avatarLabel = computed(() => {
    const r = this.authService.role();
    return r === 'administradora' ? 'AD' : r === 'profissional' ? 'PR' : '—';
  });
}
