import { Routes } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from './auth/auth';
import { NewsFeedComponent } from './components/news-feed/news-feed';
import { LoginComponent } from './components/login/login';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AccountActivationComponent } from './components/account-activation/account-activation';
import { ReaderRegistrationComponent } from './components/reader-registration/reader-registration';
import { PublisherRegistrationComponent } from './publisher/components/publisher-registration/publisher-registration';
import { publisherGuard } from './publisher/publisher.guard';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return true;
  if (authService.isAuthenticated()) return true;
  return router.parseUrl('/');
};

const roleGuard = (allowedRoles: string[]) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser();
    
    if (user && allowedRoles.includes(user.role)) return true;
    
    // Fallback if role doesn't match
    if (user?.role === 'admin') return router.parseUrl('/admin');
    if (user?.role === 'publisher') return router.parseUrl('/publisher');
    return router.parseUrl('/');
  };
};

const rootRedirection = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();
  
  if (!user) return true; // Show NewsFeed to anonymous
  
  if (user.role === 'admin') return router.parseUrl('/admin');
  if (user.role === 'publisher') return router.parseUrl('/publisher');
  return true; // Readers stay on NewsFeed
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { path: 'sources', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { path: 'readers', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { path: 'user', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { 
    path: 'publisher', 
    loadChildren: () => import('./publisher/publisher.routes').then(m => m.publisherRoutes),
    canActivate: [publisherGuard]
  },
  { path: 'article', redirectTo: 'publisher/articles', pathMatch: 'full' },
  { path: 'register-publisher', component: PublisherRegistrationComponent },
  { path: 'activate-account', component: AccountActivationComponent },
  { path: 'register', component: ReaderRegistrationComponent },
  { path: '', component: NewsFeedComponent, canActivate: [rootRedirection] }
];
