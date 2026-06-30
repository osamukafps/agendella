import { AuthService } from './../auth/auth.service';
import { Component, HostListener, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { CollaboratorRole } from '../auth/auth.models';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { ShellTopbarService } from './shell-topbar.service';

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
  { id: 'ausencias',       label: 'Ausências',       route: '/ausencias',             roles: ['administradora', 'profissional'] },
];

export function getNavItemsForRole(role: CollaboratorRole | null): NavItem[] {
  if (!role) return [];
  return ALL_NAV_ITEMS.filter(item => item.roles.includes(role));
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ConfirmDialogComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  host: {
    '[class.shell--sidebar-collapsed]': 'isSidebarCollapsed()',
  },
})
export class AppShellComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router      = inject(Router);
  private readonly shellTopbar = inject(ShellTopbarService);
  private readonly currentDateTime = signal(new Date());
  private readonly clockTimerId = typeof window === 'undefined'
    ? null
    : window.setInterval(() => this.currentDateTime.set(new Date()), 60_000);

  readonly currentUser = this.authService.currentUser;
  readonly role        = this.authService.role;
  readonly navItems    = computed(() => getNavItemsForRole(this.authService.role()));
  readonly menuOpen    = signal(false);
  readonly isDesktop   = signal(this.readDesktopBreakpoint());
  readonly isSidebarViewport = signal(this.readSidebarBreakpoint());
  readonly isSidebarCollapsed = signal(false);
  readonly topbarAction = this.shellTopbar.action;
  readonly sidebarToggleLabel = computed(() =>
    this.isSidebarCollapsed()
      ? 'Expandir navegação lateral'
      : 'Recolher navegação lateral'
  );

  readonly todayLabel = computed(() =>
    new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(this.currentDateTime())
  );

  readonly firstName = computed(() => {
    const displayName = this.currentUser()?.displayName?.trim();
    return displayName ? displayName.split(/\s+/)[0] : 'Beleza';
  });

  readonly greetingLabel = computed(() => {
    const hour = this.currentDateTime().getHours();
    const greeting = hour < 12
      ? 'Bom dia'
      : hour < 18
        ? 'Boa tarde'
        : 'Boa noite';

    return `${greeting}, ${this.firstName()}`;
  });

  readonly roleContextLabel = computed(() => this.role() === 'administradora'
    ? 'Gestão do salão'
    : 'Rotina profissional');

  readonly roleDisplayLabel = computed(() => this.role() === 'administradora'
    ? 'Administradora'
    : 'Profissional');

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

  readonly salonContextLabel = computed(() => {
    const salonName = this.salonName().trim();
    return salonName ? salonName.toUpperCase() : 'AGENDELLA';
  });

  private readDesktopBreakpoint(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  }

  private readSidebarBreakpoint(): boolean {
    return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  }

  ngOnDestroy(): void {
    if (this.clockTimerId !== null) {
      window.clearInterval(this.clockTimerId);
    }
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  toggleSidebar(): void {
    if (!this.isSidebarViewport()) {
      return;
    }

    this.isSidebarCollapsed.update(value => !value);
  }

  async logout(): Promise<void> {
    this.closeMenu();
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: EventTarget | null): void {
    if (!this.menuOpen()) return;
    if (!(target as HTMLElement | null)?.closest?.('.topbar-profile')) {
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
    this.isSidebarViewport.set(this.readSidebarBreakpoint());
  }
}
