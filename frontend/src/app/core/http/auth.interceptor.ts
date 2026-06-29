import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { from, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const withBearer = (r: HttpRequest<unknown>): HttpRequest<unknown> => {
    const token = authService.accessToken();
    return token
      ? r.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : r;
  };

  // Não tenta refresh em endpoints de auth — evita loop infinito
  const isAuthEndpoint = req.url.includes('/auth/');

  return next(withBearer(req)).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint) {
        return from(authService.refresh()).pipe(
          switchMap(() => next(withBearer(req))),
          catchError(() => throwError(() => error))
        );
      }
      return throwError(() => error);
    })
  );
};
