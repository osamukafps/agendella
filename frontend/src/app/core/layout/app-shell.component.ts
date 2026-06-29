import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import type { CollaboratorRole } from '../auth/auth.models';

export interface NavItem {
  id: string;
  label: string;
  route: string;
  /** Roles autorizadas. Array vazio = nenhuma restrição. */
  roles: CollaboratorRole[];
}

export const ALL_NAV_ITEMS: NavItem[] = [
  { id: 'agenda',   label: 'Agenda',   route: '/agenda',   roles: ['administradora', 'profissional'] },
  { id: 'clientes', label: 'Clientes', route: '/clientes', roles: ['administradora', 'profissional'] },
  { id: 'servicos', label: 'Serviços', route: '/servicos', roles: ['administradora'] },
  { id: 'perfil',   label: 'Perfil',   route: '/perfil',   roles: ['administradora', 'profissional'] },
];

export function getNavItemsForRole(role: CollaboratorRole | null): NavItem[] {
  if (!role) return [];
  return ALL_NAV_ITEMS.filter(item => item.roles.includes(role));
}

// Template mínimo — implementação completa em T124
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="app-header">
      <span class="salon-name">{{ currentUser()?.tenantId }}</span>
    </header>

    <main>
      <router-outlet />
    </main>

    <nav class="bottom-nav" aria-label="Navegação principal">
      @for (item of navItems(); track item.id) {
        <a
          [routerLink]="item.route"
          routerLinkActive="active"
          [attr.aria-label]="item.label"
        >{{ item.label }}</a>
      }
    </nav>
  `,
})
export class AppShellComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly role = this.authService.role;
  readonly navItems = computed(() => getNavItemsForRole(this.authService.role()));
}
