import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** Bloqueia usuários não autenticados → redireciona para /login */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

/** Bloqueia qualquer role que não seja administradora → redireciona para /agenda */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.role() === 'administradora' ? true : router.createUrlTree(['/agenda']);
};

/** Bloqueia usuários não autenticados e não profissional → redireciona para /agenda */
export const professionalGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.role() === 'profissional' ? true : router.createUrlTree(['/agenda']);
};

/** Redireciona usuário JÁ autenticado para /agenda — evita exibir login novamente */
export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated() ? router.createUrlTree(['/agenda']) : true;
};
