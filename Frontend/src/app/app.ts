import { Component, signal, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterLink } from '@angular/router';
import { ToastComponent } from './components/common/toast/toast';
import { AdSlotComponent } from './components/ad-slot/ad-slot';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, ToastComponent, AdSlotComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  protected readonly title = signal('News Aggregator');
  isFloatingAdVisible = signal(false);
  hasFloatingAd = signal(false);
  isNewsFeedPage = signal(false);

  constructor() {
    // Show floating ad every 5 minutes (300,000 ms)
    if (isPlatformBrowser(this.platformId)) {
      setInterval(() => {
        // Only trigger if we are on the news feed page and it's currently hidden
        if (this.isNewsFeedPage() && !this.isFloatingAdVisible()) {
          this.isFloatingAdVisible.set(true);
        }
      }, 30000);

      // Initial trigger after 5 minutes too
      setTimeout(() => {
        if (this.isNewsFeedPage()) {
          this.isFloatingAdVisible.set(true);
        }
      }, 3000);
    }
  }

  ngOnInit() {
    this.checkCurrentRoute();

    // Monitor route changes to auto-hide the floating ad outside NewsFeed
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkCurrentRoute();
    });
  }

  private checkCurrentRoute() {
    const url = this.router.url.split('?')[0]; // Ignore query params
    // News-Feed pages are: /, or category paths like /Politics, /Business
    // But NOT /article/..., /admin, /profile, etc.
    const isSpecialPath = url.includes('/article/') || url.includes('/admin') || url.includes('/profile') || url.includes('/publisher') || url.includes('/login') || url.includes('/register') || url.includes('/subscription');
    this.isNewsFeedPage.set(!isSpecialPath);
  }

  onAdLoaded(exists: boolean) {
    this.hasFloatingAd.set(exists);
  }

  closeFloatingAd() {
    this.isFloatingAdVisible.set(false);
    this.hasFloatingAd.set(false);
  }
}
