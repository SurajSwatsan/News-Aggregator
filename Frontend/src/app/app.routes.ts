import { Routes } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

import { AuthService } from './auth/auth';
import { NewsFeedComponent } from './components/news-feed/news-feed';
import { LoginComponent } from './auth/login/login';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AccountActivationComponent } from './auth/account-activation/account-activation';
import { UserRegisterComponent } from './auth/user-register/user-register';
import { ArticleDetailComponent } from './components/article-detail/article-detail';
import { SourceProfileComponent } from './components/source-profile/source-profile';
import { PublisherRegistrationComponent } from './publisher/components/publisher-registration/publisher-registration';
import { SubscriptionComponent } from './components/subscription/subscription';
import { PaymentModalComponent } from './components/payment-modal/payment-modal';
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

// ✅ Public guard: always allows access regardless of login state
// Use on token-based pages (confirm-approval, activate-account, onboarding)
// so logged-in admins are NOT bounced away by role guards
const publicGuard = () => true;

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'profile', loadComponent: () => import('./components/user-profile/user-profile').then(m => m.UserProfileComponent), canActivate: [authGuard] },
  { path: 'edit-profile', loadComponent: () => import('./components/user-edit-profile/user-edit-profile').then(m => m.UserEditProfileComponent), canActivate: [authGuard] },

  { path: 'subscription', component: SubscriptionComponent, canActivate: [authGuard] },
  { path: 'payment', component: PaymentModalComponent, canActivate: [authGuard] },
  { path: 'forgot-password', loadComponent: () => import('./auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./auth/reset-password/reset-password').then(m => m.ResetPasswordComponent) },
  { path: 'article/:id', component: ArticleDetailComponent },
  { path: 'source/:id', component: SourceProfileComponent },
  { path: 'admin',

 component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { path: 'sources', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { path: 'readers', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { path: 'user', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { path: 'audit', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { path: 'ads', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { path: 'master', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { path: 'subscriptions', component: AdminDashboardComponent, canActivate: [authGuard, roleGuard(['admin'])] },
  { 
    path: 'publisher', 
    loadChildren: () => import('./publisher/publisher.routes').then(m => m.publisherRoutes),
    canActivate: [publisherGuard]
  },
  { path: 'article', redirectTo: 'publisher/articles', pathMatch: 'full' },
  { path: 'register-publisher', component: UserRegisterComponent },
  { path: 'onboarding', component: PublisherRegistrationComponent, canActivate: [publicGuard] },
  // ✅ confirm-approval and activate-account are PUBLIC token pages — never redirect logged-in users
  { path: 'confirm-approval', canActivate: [publicGuard], loadComponent: () => import('./auth/confirm-approval/confirm-approval').then(m => m.ConfirmApprovalComponent) },
  { path: 'activate-account', component: AccountActivationComponent, canActivate: [publicGuard] },
  { path: 'register', component: UserRegisterComponent },
  { path: ':category', component: NewsFeedComponent, canActivate: [rootRedirection] },
  { path: '', component: NewsFeedComponent, canActivate: [rootRedirection] }
];
