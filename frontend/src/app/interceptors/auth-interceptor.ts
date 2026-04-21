import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
  HttpClient,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { API_URL } from '../api/api.config';
import {
  catchError,
  switchMap,
  throwError,
  BehaviorSubject,
  filter,
  take,
  Observable,
} from 'rxjs';

let isRefreshing = false;
const refreshedToken$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);

  const isAuthEndpoint =
    req.url.includes('/auth/login/') ||
    req.url.includes('/auth/refresh/') ||
    req.url.includes('/auth/logout/');

  if (isAuthEndpoint && !req.url.includes('/auth/logout/')) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');
  const authReq = token ? addToken(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status === 401 &&
        !req.url.includes('/auth/login/') &&
        !req.url.includes('/auth/refresh/')
      ) {
        return handle401(req, next, http, router);
      }
      return throwError(() => error);
    })
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function handle401(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  http: HttpClient,
  router: Router
): Observable<any> {
  if (isRefreshing) {
    return refreshedToken$.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((newToken) => next(addToken(req, newToken)))
    );
  }

  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    forceLogout(router);
    return throwError(() => new Error('No refresh token'));
  }

  isRefreshing = true;
  refreshedToken$.next(null);

  return http
    .post<{ access: string; refresh?: string }>(
      `${API_URL}/auth/refresh/`,
      { refresh: refreshToken }
    )
    .pipe(
      switchMap((tokens) => {
        isRefreshing = false;
        localStorage.setItem('access_token', tokens.access);
        if (tokens.refresh) {
          localStorage.setItem('refresh_token', tokens.refresh);
        }
        refreshedToken$.next(tokens.access);
        return next(addToken(req, tokens.access));
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        refreshedToken$.next(null);
        forceLogout(router);
        return throwError(() => refreshError);
      })
    );
}

function forceLogout(router: Router): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  router.navigate(['/login']);
}