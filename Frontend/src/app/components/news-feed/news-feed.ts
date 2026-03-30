import { Component, signal, inject, OnInit, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth';
import { AccessService } from '../../services/access.service';
import { ProfileDropdownComponent } from '../profile-dropdown/profile-dropdown';
import { FooterComponent } from '../footer/footer';
import { AdSlotComponent } from '../ad-slot/ad-slot';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-news-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, SafeHtmlPipe, ProfileDropdownComponent, FormsModule, FooterComponent, AdSlotComponent],
  templateUrl: './news-feed.html',
  styleUrl: './news-feed.scss'
})
export class NewsFeedComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private accessService = inject(AccessService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  articles = signal<any[]>([]);
  searchQuery = '';
  isLoading = signal(true);
  selectedCategory = signal<string>('All');
  showPaymentModal = signal(false);
  currentUser = this.auth.currentUser;

  // Computed properties for specialized layout
  featuredArticle = computed(() => this.articles()[0]);
  heroArticles = computed(() => this.articles().slice(1, 4));
  trendingArticles = signal<any[]>([]);
  topArticles = computed(() => this.articles().slice(0, 10)); // Top 10 for the ticker
  currentDate = signal(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));

  // Weather & Location Signals
  temperature = signal<string>('--°C');
  locationInfo = signal<string>('Detecting...');

  // Pagination & Infinite Scroll Signals
  skip = signal<number>(0);
  pageSize = 26;
  hasMore = signal<boolean>(true);
  isFetchingMore = signal<boolean>(false);
  lastUpdated = signal<string>('');

  categories = [
    'All', 'General', 'World', 'Politics', 'Business', 'Technology',
    'Science', 'Health', 'Agriculture', 'Sports', 'Crime', 'Entertainment', 'Lifestyle', 'Environment'
  ];

  spotlightCategories = signal<any[]>([]);

  ngOnInit() {
    this.route.params.subscribe(params => {
      const categoryParam = params['category'];
      if (categoryParam) {
        // Map lowercase URL param back to capitalized category name
        const category = this.categories.find(c => c.toLowerCase() === categoryParam.toLowerCase());
        if (category) {
          this.selectedCategory.set(category);
        } else {
          this.selectedCategory.set('All');
        }
      } else {
        this.selectedCategory.set('All');
      }
      this.isLoading.set(true);
      this.articles.set([]); // Reset for new category
      this.skip.set(0);
      this.hasMore.set(true);
      this.fetchArticles();
      this.fetchTrending();
      this.fetchWeather();

      if (this.selectedCategory() === 'All') {
        this.fetchSpotlightCategories();
      }
    });
  }

  fetchSpotlightCategories() {
    const spotlights = ['Crime', 'Health', 'Sports', 'Entertainment'];
    const requests = spotlights.map(cat =>
      this.http.get<any[]>(`http://localhost:3000/articles?category=${cat}&take=12`)
    );

    import('rxjs').then(({ forkJoin }) => {
      forkJoin(requests).subscribe(results => {
        const spotlightData = spotlights.map((name, index) => ({
          name,
          articles: results[index] || []
        })).filter(s => s.articles.length > 0);
        this.spotlightCategories.set(spotlightData);
      });
    });
  }

  scrollSpotlight(id: string, direction: 'left' | 'right') {
    const el = document.getElementById(id);
    if (el) {
      const scrollAmount = 600;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }

  logout() {
    this.auth.logout();
  }

  selectCategory(category: string) {
    if (category === 'All') {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/' + category.toLowerCase()]);
    }
  }

  fetchArticles() {
    console.log('[NewsFeed] Fetching articles for category:', this.selectedCategory(), 'query:', this.searchQuery);

    // Use the api root from environment (which usually points to http://localhost:3000/api)
    // But since AppController is at root, we might need to adjust.
    // Let's use whatever is working, but add logging.
    let baseUrl = 'http://localhost:3000/articles';
    const params: string[] = [];

    params.push(`skip=${this.skip()}`);
    params.push(`take=${this.pageSize}`);

    if (this.selectedCategory() !== 'All') {
      params.push(`category=${this.selectedCategory()}`);
    }

    if (this.searchQuery) {
      params.push(`q=${encodeURIComponent(this.searchQuery.trim())}`);
    }

    const finalUrl = params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl;
    console.log('[NewsFeed] Requesting URL:', finalUrl);

    this.http.get<any[]>(finalUrl).subscribe({
      next: (res) => {
        console.log('[NewsFeed] Received articles:', res.length);
        if (this.skip() === 0) {
          this.articles.set(res);
        } else {
          this.articles.update(prev => [...prev, ...res]);
        }

        this.lastUpdated.set(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
        this.isLoading.set(false);
        this.isFetchingMore.set(false);

        if (res.length < this.pageSize) {
          this.hasMore.set(false);
        }
      },
      error: (err) => {
        console.error('[NewsFeed] Error fetching articles:', err);
        this.isLoading.set(false);
        this.isFetchingMore.set(false);
      }
    });
  }

  fetchTrending() {
    this.http.get<any[]>('http://localhost:3000/articles/trending').subscribe({
      next: (res) => {
        this.trendingArticles.set(res || []);
      },
      error: (err) => {
        console.error('[NewsFeed] Error fetching trending:', err);
        // Fallback to slice logic if API fails
        this.trendingArticles.set(this.articles().slice(4, 10));
      }
    });
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getTimeAgo(date: string): string {
    const now = new Date();
    const posted = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - posted.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return this.formatDate(date);
  }

  onSearch() {
    this.isLoading.set(true);
    this.articles.set([]);
    this.skip.set(0);
    this.hasMore.set(true);
    this.fetchArticles();
  }


  loadMore() {
    console.log('[NewsFeed] Loading more articles...');
    this.isFetchingMore.set(true);
    this.skip.update(s => s + this.pageSize);
    this.fetchArticles();
  }

  handleArticleAccess(article: any) {
    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    // 1. Check if user already has access to this article
    this.accessService.checkAccess(article.id).subscribe(hasAccess => {
      if (hasAccess) {
        // Already unlocked, just navigate silently
        this.router.navigate(['/article', article.id]);
      } else {
        // 2. Not unlocked - check credit balance (handle string/number decimal)
        const balance = Number(user.creditBalance);

        if (balance >= 1) {
          // 3. Has credits - deduct (grantAccess) and then navigate
          this.accessService.grantAccess(article.id).subscribe(success => {
            if (success) {
              this.router.navigate(['/article', article.id]);
            }
          });
        } else {
          // 4. Insufficient credits - trigger payment flow
          this.showPaymentModal.set(true);
        }
      }
    });
  }

  handleImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000';
  }

  hasSynopsisText(synopsis: string): boolean {
    if (!synopsis) return false;
    const stripped = synopsis.replace(/<[^>]*>?/gm, '').trim();
    return stripped.length > 0;
  }

  fetchWeather() {
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          // 1. Fetch Temperature from Open-Meteo
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
          this.http.get<any>(weatherUrl).subscribe({
            next: (data) => {
              if (data.current_weather) {
                this.temperature.set(`${Math.round(data.current_weather.temperature)}°C`);
              }
            },
            error: () => this.temperature.set('N/A')
          });

          // 2. Fetch Location Name from BigDataCloud (Free, no key required for simple client requests)
          const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
          this.http.get<any>(geoUrl).subscribe({
            next: (data) => {
              const city = data.city || data.locality || data.principalSubdivision || 'LOCAL';
              this.locationInfo.set(city.toUpperCase());
            },
            error: () => this.locationInfo.set('INDIA')
          });
        },
        (error) => {
          console.warn('Geolocation error:', error);
          this.locationInfo.set('INDIA');
          this.temperature.set('30°C'); // Fallback
        }
      );
    } else {
      this.locationInfo.set('INDIA');
      this.temperature.set('30°C'); // Fallback
    }
  }
}
