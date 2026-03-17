import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { PublisherDashboardComponent } from './components/publisher-dashboard/publisher-dashboard';
import { PublisherRegistrationComponent } from './components/publisher-registration/publisher-registration';
import { NewsFeedComponent } from './components/news-feed/news-feed';
import { UserManagementComponent } from './components/user-management/user-management';
import { AccountActivationComponent } from './components/account-activation/account-activation';
import { ReaderRegistrationComponent } from './components/reader-registration/reader-registration';
import { inject, PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth/auth';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) return true;

  if (authService.isAuthenticated()) return true;
  return router.parseUrl('/login');
};

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard] },
  { path: 'user', component: UserManagementComponent, canActivate: [authGuard] },
  { path: 'publisher', component: PublisherDashboardComponent, canActivate: [authGuard] },
  { path: 'register-publisher', component: PublisherRegistrationComponent },
  { path: 'activate-account', component: AccountActivationComponent },
  { path: 'register', component: ReaderRegistrationComponent },
  { path: '', component: NewsFeedComponent }
];
