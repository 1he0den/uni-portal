import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, switchMap, tap, catchError } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { API_URL } from '../api/api.config';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  access: string;
  refresh: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: Extract<UserRole, 'student' | 'teacher'>;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = API_URL;

  // Реактивное состояние текущего юзера
  private _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly role = computed(() => this._currentUser()?.role ?? null);

  /** Логин + подтягиваем профиль в состояние */
  login(data: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login/`, data).pipe(
      tap((tokens) => this.saveTokens(tokens.access, tokens.refresh)),
      switchMap((tokens) =>
        this.getProfile().pipe(
          tap((user) => this._currentUser.set(user)),
          switchMap(() => of(tokens))
        )
      )
    );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/`, data);
  }

  /** Регистрация + автологин */
  registerAndLogin(data: RegisterRequest): Observable<LoginResponse> {
    return this.register(data).pipe(
      switchMap(() =>
        this.login({ username: data.username, password: data.password })
      )
    );
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile/`);
  }

  /** На старте приложения — если токен есть, подтянем юзера */
  loadCurrentUserIfToken(): Observable<User | null> {
    if (!this.getAccessToken()) {
      this._currentUser.set(null);
      return of(null);
    }
    return this.getProfile().pipe(
      tap((user) => this._currentUser.set(user)),
      catchError(() => {
        this.logoutLocal();
        return of(null);
      })
    );
  }

  logout(): Observable<void> {
    const refresh = this.getRefreshToken();
    const cleanup = () => {
      this.logoutLocal();
      this._currentUser.set(null);
    };
    if (!refresh) {
      cleanup();
      return of(void 0);
    }
    return this.http
      .post<void>(`${this.apiUrl}/auth/logout/`, { refresh })
      .pipe(
        tap(() => cleanup()),
        catchError(() => {
          cleanup();
          return of(void 0);
        })
      );
  }

  saveTokens(access: string, refresh: string): void {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  logoutLocal(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}