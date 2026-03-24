import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth';
import { tap, of, catchError, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccessService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000';

  checkAccess(articleId: string) {
    const user = this.auth.currentUser();
    if (!user) return of(false);
    
    return this.http.get<any>(`${this.apiUrl}/access-logs/${user.id}/${articleId}`).pipe(
      map(res => {
        if (typeof res === 'object') return !!res.access;
        return !!res;
      }),
      catchError((err) => {
        console.error('Backend access check failed:', err);
        return of(false);
      })
    );
  }

  grantAccess(articleId: string) {
    const user = this.auth.currentUser();
    if (!user) return of(false);

    return this.http.post<any>(`${this.apiUrl}/access-logs`, {
      userId: user.id,
      articleId: articleId
    }).pipe(
      tap(() => {
        // Force refresh user profile to securely get updated credits from database
        this.auth.refreshProfile().subscribe();
      }),
      map(() => true),
      catchError((err) => {
        console.error('Grant access backend failed:', err);
        return of(false);
      })
    );
  }

  addCredits(credits: number) {
    const user = this.auth.currentUser();
    if (!user) return of(null);

    return this.http.post<any>(`${this.apiUrl}/auth/add-credits`, {
      userId: user.id,
      credits: credits
    }).pipe(
      tap(() => {
        // Refresh user profile to get updated credits
        this.auth.refreshProfile().subscribe();
      })
    );
  }
}
