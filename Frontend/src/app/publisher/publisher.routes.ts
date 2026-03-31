import { Routes } from '@angular/router';
import { PublisherDashboardComponent } from './components/publisher-dashboard/publisher-dashboard';
import { PublisherOverviewComponent } from './components/publisher-overview/publisher-overview';
import { PublisherArticlesComponent } from './components/publisher-articles/publisher-articles';
import { PublisherAnalyticsComponent } from './components/publisher-analytics/publisher-analytics';
import { PublisherRevenueComponent } from './components/publisher-revenue/publisher-revenue';
import { PublisherPayoutsComponent } from './components/publisher-payouts/publisher-payouts';
import { PublisherAdsComponent } from './components/publisher-ads/publisher-ads';
import { PublisherProfileComponent } from './components/publisher-profile/publisher-profile';
import { PublisherProfileEditComponent } from './components/publisher-profile-edit/publisher-profile-edit';

export const publisherRoutes: Routes = [
  { 
    path: '', 
    component: PublisherDashboardComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: PublisherOverviewComponent },
      { path: 'articles', component: PublisherArticlesComponent },
      { path: 'analytics', component: PublisherAnalyticsComponent },
      { path: 'revenue', component: PublisherRevenueComponent },
      { path: 'payouts', component: PublisherPayoutsComponent },
      { path: 'ads', component: PublisherAdsComponent },
      { path: 'settings', component: PublisherProfileComponent },
      { path: 'profile', component: PublisherProfileComponent },
      { path: 'profile/edit', component: PublisherProfileEditComponent }
    ]
  }
];
