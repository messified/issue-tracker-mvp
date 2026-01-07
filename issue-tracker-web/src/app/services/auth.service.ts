import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';
  private readonly API_URL = environment.apiUrl || 'http://localhost:8080/api';

  private authenticated$ = new BehaviorSubject<boolean>(
    !!localStorage.getItem(this.TOKEN_KEY)
  );

  private user$ = new BehaviorSubject<AuthUser | null>(
    this.getStoredUser()
  );

  /** Observable auth state */
  isAuthenticated$: Observable<boolean> = this.authenticated$.asObservable();

  /** Observable user */
  userObservable$: Observable<AuthUser | null> = this.user$.asObservable();

  constructor(private http: HttpClient) {}

  /** Synchronous auth check */
  isAuthenticated(): boolean {
    return this.authenticated$.value;
  }

  /** Get stored user from localStorage */
  private getStoredUser(): AuthUser | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  /** Sign up new user */
  signUp(name: string, email: string, password: string): Observable<AuthUser> {
    const signUpData: SignUpRequest = { name, email, password };
    
    return this.http.post<{ user: AuthUser; token: string }>(`${this.API_URL}/auth/signup`, signUpData)
      .pipe(
        tap(response => {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
          this.authenticated$.next(true);
          this.user$.next(response.user);
        }),
        map(response => response.user),
        catchError(error => {
          console.error('Sign up error:', error);
          return throwError(() => error);
        })
      );
  }

  /** Login user */
  login(email: string, password: string): Observable<AuthUser> {
    const loginData: LoginRequest = { email, password };
    
    return this.http.post<{ user: AuthUser; token: string }>(`${this.API_URL}/auth/login`, loginData)
      .pipe(
        tap(response => {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
          this.authenticated$.next(true);
          this.user$.next(response.user);
        }),
        map(response => response.user),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /** Logout and clear state */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.authenticated$.next(false);
    this.user$.next(null);
  }

  /** Retrieve stored token */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Get current user */
  getCurrentUser(): AuthUser | null {
    return this.user$.value;
  }
}
