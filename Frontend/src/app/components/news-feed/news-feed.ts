import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/auth';
import { AccessService } from '../../services/access.service';
import { PaymentModalComponent } from '../payment-modal/payment-modal';
import { ProfileDropdownComponent } from '../profile-dropdown/profile-dropdown';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-news-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, SafeHtmlPipe, PaymentModalComponent, ProfileDropdownComponent, FormsModule],
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
  trendingArticles = computed(() => this.articles().slice(4, 10));
  topArticles = computed(() => this.articles().slice(0, 10)); // Top 10 for the ticker
  currentDate = signal(new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  
  categories = [
    'All', 'General', 'World', 'Politics', 'Business', 'Technology', 
    'Science', 'Health', 'Sports', 'Entertainment', 'Lifestyle', 'Environment'
  ];

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
      this.fetchArticles();
    });
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
        this.articles.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('[NewsFeed] Error fetching articles:', err);
        this.isLoading.set(false);
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

  onSearch() {
    this.isLoading.set(true);
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
        // Already unlocked, just navigate
        this.toast.show('Accessing premium story (previously unlocked)', 'info');
        this.router.navigate(['/article', article.id]);
      } else {
        // 2. Not unlocked - check credit balance (handle string/number decimal)
        const balance = Number(user.creditBalance);
        
        if (balance >= 1) {
          // 3. Has credits - deduct (grantAccess) and then navigate
          this.accessService.grantAccess(article.id).subscribe(success => {
            if (success) {
              this.toast.show('Premium Story Unlocked! (1 Credit used)');
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
}
