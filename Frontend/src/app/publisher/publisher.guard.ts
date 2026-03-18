import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../auth/auth';

export const publisherGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  
  if (!isPlatformBrowser(platformId)) return true;
  
  const user = authService.currentUser();
  if (authService.isAuthenticated() && user?.role === 'publisher') {
    return true;
  }
  
  if (user?.role === 'admin') return router.parseUrl('/admin');
  return router.parseUrl('/');
};
