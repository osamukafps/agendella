import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell.component';
import { authGuard, adminGuard, loginGuard } from './core/auth/auth.guard';

@Component({ standalone: true, template: '' })
class PlaceholderPage {}

export const routes: Routes = [
  // ─── Login ────────────────────────────────────────────────────────────────
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./features/auth/login-page.component').then(m => m.LoginPageComponent),
  },

  // ─── Shell autenticado ────────────────────────────────────────────────────
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'agenda', pathMatch: 'full' },

      // ── Agenda — Fase 10 ────────────────────────────────────────────────
      {
        path: 'agenda',
        loadComponent: () =>
          import('./features/agenda/agenda-page.component').then(m => m.AgendaPageComponent),
      },
      {
        path: 'minha-agenda',
        loadComponent: () =>
          import('./features/agenda/my-agenda-page.component').then(m => m.MyAgendaPageComponent),
      },

      // ── Cadastros — Fase 9 ───────────────────────────────────────────────
      {
        path: 'salon',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/salon-settings/salon-settings-page.component')
            .then(m => m.SalonSettingsPageComponent),
      },
      {
        path: 'servicos',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/services/services-page.component')
            .then(m => m.ServicesPageComponent),
      },
      {
        path: 'profissionais',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/professionals/professionals-page.component')
            .then(m => m.ProfessionalsPageComponent),
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/clients/clients-page.component')
            .then(m => m.ClientsPageComponent),
      },

      // ── Disponibilidade própria (US2) ────────────────────────────────────
      {
        path: 'minha-disponibilidade',
        loadComponent: () =>
          import('./features/professionals/my-availability-page.component')
            .then(m => m.MyAvailabilityPageComponent),
      },

      // ── Fase 11 (placeholders) ────────────────────────────────────────────
      { path: 'bloqueios', component: PlaceholderPage, canActivate: [adminGuard] },
      { path: 'ausencias', component: PlaceholderPage },

      // ── Perfil ────────────────────────────────────────────────────────────
      { path: 'perfil', component: PlaceholderPage },
    ],
  },

  { path: '**', redirectTo: '' },
];
