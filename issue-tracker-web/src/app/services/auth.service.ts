import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AuthUser {
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';

  private authenticated$ = new BehaviorSubject<boolean>(
    !!localStorage.getItem(this.TOKEN_KEY)
  );

  private user$ = new BehaviorSubject<AuthUser | null>(null);

  /** Observable auth state */
  isAuthenticated$: Observable<boolean> = this.authenticated$.asObservable();

  /** Observable user */
  userObservable$: Observable<AuthUser | null> = this.user$.asObservable();

  /** Synchronous auth check */
  isAuthenticated(): boolean {
    return this.authenticated$.value;
  }

  /** Login placeholder (replace with API call later) */
  login(email: string, password: string): void {
    // Simulate successful login
    const fakeToken = 'mock-jwt-token';

    localStorage.setItem(this.TOKEN_KEY, fakeToken);
    this.authenticated$.next(true);
    this.user$.next({ email });
  }

  /** Logout and clear state */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.authenticated$.next(false);
    this.user$.next(null);
  }

  /** Retrieve stored token */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
}
