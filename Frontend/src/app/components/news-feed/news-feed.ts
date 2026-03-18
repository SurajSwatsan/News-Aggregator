import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { AuthService } from '../../auth/auth';
import { AccessService } from '../../services/access.service';
import { PaymentModalComponent } from '../payment-modal/payment-modal';

@Component({
  selector: 'app-news-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, SafeHtmlPipe, PaymentModalComponent],
  templateUrl: './news-feed.html',
  styleUrl: './news-feed.css'
})
export class NewsFeedComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private accessService = inject(AccessService);
  private router = inject(Router);

  articles = signal<any[]>([]);
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
    this.fetchArticles();
  }

  logout() {
    this.auth.logout();
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
    this.isLoading.set(true);
    this.fetchArticles();
  }

  fetchArticles() {
    let url = 'http://localhost:3000/articles';
    if (this.selectedCategory() !== 'All') {
      url += `?category=${this.selectedCategory()}`;
    }
    
    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.articles.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  handleArticleAccess(article: any) {
    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.accessService.checkAccess(article.id).subscribe(hasAccess => {
      if (hasAccess) {
        window.open(article.sourceUrl, '_blank');
      } else {
        const user = this.auth.currentUser();
        if (user && user.credits > 0) {
          if (confirm(`Spending 1 credit to unlock: ${article.title}`)) {
            this.accessService.grantAccess(article.id).subscribe(() => {
              window.open(article.sourceUrl, '_blank');
            });
          }
        } else {
          this.showPaymentModal.set(true);
        }
      }
    });
  }
}
