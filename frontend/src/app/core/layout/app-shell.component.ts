import { AuthService } from './../auth/auth.service';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
  { id: 'profissionais',   label: 'Equipe',          route: '/profissionais',         roles: ['administradora'] },
  { id: 'bloqueios',       label: 'Bloqueios',       route: '/bloqueios',             roles: ['administradora'] },
  { id: 'disponibilidade', label: 'Disponível.',     route: '/minha-disponibilidade', roles: ['profissional'] },
  { id: 'ausencias',       label: 'Ausências',       route: '/ausencias',             roles: ['profissional'] },
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
  private readonly router      = inject(Router);

  readonly currentUser = this.authService.currentUser;
  readonly role        = this.authService.role;
  readonly navItems    = computed(() => getNavItemsForRole(this.authService.role()));
  readonly menuOpen    = signal(false);
  readonly isDesktop   = signal(this.readDesktopBreakpoint());

  readonly todayLabel = computed(() =>
    new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date())
  );

  readonly roleLabel = computed(() => this.role() === 'administradora'
    ? 'Gestão do salão'
    : 'Rotina profissional');

  readonly avatarLabel = computed(() => {
    const name = this.authService.currentUser()?.displayName;
    if (!name) return '—';
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  });

  readonly salonName = computed(() =>
    this.authService.currentUser()?.salonName ?? ''
  );

  private readDesktopBreakpoint(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  async logout(): Promise<void> {
    this.closeMenu();
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: EventTarget | null): void {
    if (!this.menuOpen()) return;
    if (!(target as HTMLElement | null)?.closest?.('.header-menu-wrapper')) {
      this.menuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuOpen.set(false);
  }

  @HostListener('window:resize')
  onResize(): void {
    this.isDesktop.set(this.readDesktopBreakpoint());
  }
}
