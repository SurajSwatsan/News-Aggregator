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
      map(res => !!res),
      catchError(() => of(false))
    );
  }

  grantAccess(articleId: string) {
    const user = this.auth.currentUser();
    if (!user) return of(null);

    return this.http.post<any>(`${this.apiUrl}/access-logs`, {
      userId: user.id,
      articleId: articleId
    }).pipe(
      tap(() => {
        // Refresh user profile to get updated credits
        this.auth.refreshProfile().subscribe();
      })
    );
  }
}
