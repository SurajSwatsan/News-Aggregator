import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/auth';
  
  currentUser = signal<any>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuth();
  }

  private checkAuth() {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      const user = localStorage.getItem('user');
      if (token && user) {
        const userData = JSON.parse(user);
        this.currentUser.set(userData);
        this.isAuthenticated.set(true);
        
        // If the stored user is missing the ID (from an old session), refresh it
        if (!userData.id) {
          this.refreshProfile().subscribe({
            error: () => {
              // Token is invalid/expired — clear session silently
              // The interceptor will handle the 401 without redirecting (profile is in SILENT_CLEAR_PATTERNS)
              this.currentUser.set(null);
              this.isAuthenticated.set(false);
            }
          });
        }
      }
    }
  }

  requestOtp(email: string, name?: string, username?: string, password?: string) {
    return this.http.post<any>(`${this.apiUrl}/request-otp`, { email, name, username, password });
  }

  verifyOtp(email: string, code: string) {
    return this.http.post<any>(`${this.apiUrl}/verify-otp`, { email, code }).pipe(
      tap(res => {
        if (res.access_token) {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.currentUser.set(res.user);
          this.isAuthenticated.set(true);
        }
      })
    );
  }

  login(credentials: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        this.currentUser.set(res.user);
        this.isAuthenticated.set(true);
      })
    );
  }

  refreshProfile() {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  logout() {
    const user = this.currentUser();
    const userRole = user?.role;
    const userId = user?.id;

    if (userRole === 'reader' && userId) {
      this.http.delete(`${this.apiUrl}/users/${userId}`).subscribe({
        next: () => this.finalizeLogout(userRole),
        error: (err) => {
          console.error('Failed to delete reader account on logout', err);
          this.finalizeLogout(userRole);
        }
      });
    } else {
      this.finalizeLogout(userRole);
    }
  }

  private finalizeLogout(userRole?: string) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      console.log('User logged out, redirecting as per role:', userRole);
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);

    // Redirect all users to home page on logout
    this.router.navigate(['/']);
  }

  forgotPassword(email: string) {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, { token, password });
  }
}
