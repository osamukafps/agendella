import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell.component';
import { authGuard, adminGuard, loginGuard } from './core/auth/auth.guard';

// Placeholder mínimo para rotas ainda não implementadas (Fases 9-11)
@Component({ standalone: true, template: '' })
class PlaceholderPage {}

export const routes: Routes = [
  // Login — redireciona para /agenda se já autenticado
  {
    path: 'login',
    canActivate: [loginGuard],
    loadComponent: () =>
      import('./features/auth/login-page.component').then(m => m.LoginPageComponent),
  },

  // Shell autenticado — layout com header + bottom nav
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'agenda', pathMatch: 'full' },

      // Fase 10 — agenda (ambos os roles)
      { path: 'agenda', component: PlaceholderPage },

      // Fase 9 — clientes (ambos os roles)
      { path: 'clientes', component: PlaceholderPage },

      // Fase 9 — serviços (apenas administradora)
      {
        path: 'servicos',
        component: PlaceholderPage,
        canActivate: [adminGuard],
      },

      // Fase 9 — configurações do salão (apenas administradora)
      {
        path: 'salon',
        component: PlaceholderPage,
        canActivate: [adminGuard],
      },

      // Fase 11 — bloqueios (apenas administradora)
      {
        path: 'bloqueios',
        component: PlaceholderPage,
        canActivate: [adminGuard],
      },

      // Fase 11 — ausências (próprio profissional ou admin)
      { path: 'ausencias', component: PlaceholderPage },

      // Perfil (ambos os roles)
      { path: 'perfil', component: PlaceholderPage },
    ],
  },

  { path: '**', redirectTo: '' },
];
