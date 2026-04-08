import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

// ✅ These public endpoints must NOT receive a Bearer token
// Sending a bad/expired token to these routes causes 401 → login redirect
const PUBLIC_URL_PATTERNS = [
  '/onboarding/confirm-approval',
  '/onboarding/activate',
  '/onboarding/verify',
  '/onboarding/register',
  '/onboarding/invite',
  '/auth/login',
  '/auth/request-otp',
  '/auth/verify-otp',
];

// 🔕 These routes clear the session on 401 but do NOT redirect to /login
// (background auto-refresh should fail silently on public pages)
const SILENT_CLEAR_PATTERNS = [
  '/auth/profile',
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  // Attach token ONLY for internal API calls (absolute or relative)
  const isInternal = req.url.startsWith('/') || req.url.startsWith(environment.apiUrl);
  // Skip attaching token for public endpoints
  const isPublic = PUBLIC_URL_PATTERNS.some(pattern => req.url.includes(pattern));

  let authReq = req;
  if (token && isInternal && !isPublic) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const isSilentClear = SILENT_CLEAR_PATTERNS.some(p => req.url.includes(p));

        if (isPublic) {
          // Public routes: do nothing, let the component handle the error
        } else if (isSilentClear) {
          // Background auto-refresh failed — clear session silently, don't redirect
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user');
          }
        } else {
          // Protected API call failed — clear session and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_role');
            localStorage.removeItem('user');
          }
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
