import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { AuthService } from '../../auth/auth';
import { AccessService } from '../../services/access.service';
import { FooterComponent } from '../footer/footer';
import { AdSlotComponent } from '../ad-slot/ad-slot';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SafeHtmlPipe, FooterComponent, AdSlotComponent],
  template: `
    <div class="reader-container" [style.--source-accent]="getSourceColor()">
      <!-- Sticky Header -->
      <nav class="reader-nav">
        <div class="nav-content">
          <button class="btn-back" (click)="goBack()">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            BACK
          </button>
          
          <div class="nav-branding">
              <div class="source-logo-frame" *ngIf="article()?.source">
                <img *ngIf="!logoError() && getLogoUrl()" [src]="getLogoUrl()" 
                     (error)="handleLogoError()" alt="">
                <div class="source-initial" *ngIf="logoError() || !getLogoUrl()">
                  {{ (article()?.source?.name || '?')[0] | uppercase }}
                </div>
              </div>
              <span class="nav-source">{{ article()?.source?.name }}</span>
              <span class="premium-badge-nav">PREMIUM</span>
              
              <div class="nav-pipe">|</div>
              
              <!-- Credits Badge (New) -->
              <div class="credits-badge" *ngIf="auth.isAuthenticated()">
                <div class="diamond-icon">
                  <svg viewBox="0 0 24 24" width="12" height="12">
                    <path d="M12 2L2 12l10 10 10-10L12 2z" fill="currentColor" />
                  </svg>
                </div>
                <span class="credits-text">{{ auth.currentUser()?.creditBalance || 0 }} CREDITS</span>
              </div>

              <div class="nav-pipe" *ngIf="article()?.title">|</div>
              <span class="nav-title" *ngIf="article()?.title">{{ article()?.title }}</span>
            </div>

          <div class="nav-actions">
            @if (article()) {
              <a [href]="article().sourceUrl" target="_self" class="btn-source-link">
                OPEN {{ article().source?.name | uppercase }}
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                </svg>
              </a>
            }
          </div>
        </div>
        
        <!-- Progress Bar -->
        <div class="progress-container">
          <div class="progress-bar" [style.width.%]="readingProgress()"></div>
        </div>
      </nav>

      @if (article()) {
        <div class="article-grid">
          <!-- Main Content -->
          <main class="article-main-content">
            <article>
              <header class="article-header">
                <div class="category-badge">{{ article().category || 'BREAKING NEWS' }}</div>
                <h1 class="main-title">{{ article().title }}</h1>
                
                <div class="article-author-meta">
                  <div class="author-details">
                    <div class="author-avatar-mini">
                      <img [src]="getFaviconUrl()" alt="">
                    </div>
                    <div class="author-text">
                      <span class="byline">Published by <strong>{{ article().source?.name }} Editorial</strong></span>
                      <span class="dateline">{{ formatDate(article().postedAt) }} • {{ getReadingTime() }} MIN READ</span>
                    </div>
                  </div>
                  
                  <div class="social-share-row">
                    <button class="share-btn"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></button>
                    <button class="share-btn"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/></svg></button>
                  </div>
                </div>
              </header>

              <figure class="featured-figure">
                <div class="premium-exclusive-banner">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  EXCLUSIVE PREMIUM INVESTIGATION
                </div>
                <div class="image-wrapper">
                  <img [src]="article().imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000'" [alt]="article().title" (error)="handleImageError($event)">
                  <div class="image-overlay-gradient"></div>
                  <span class="photo-credit">IMAGE CREDIT: {{ article().source?.name }} ARCHIVE</span>
                </div>
              </figure>

              <div class="article-content-body">
                <div class="story-text" [innerHTML]="article().synopsis | safeHtml"></div>
                
                <div class="read-more-footer">
                  <div class="footer-divider"></div>
                  <p>This article summary is provided by our elite news network. Continue reading the full investigation on the official website.</p>
                  <a [href]="article().sourceUrl" target="_self" class="btn-full-story">
                    READ ON {{ article().source?.name | uppercase }}
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            </article>
            <app-ad-slot placementType="header"></app-ad-slot>
          </main>

          <!-- Sidebar -->
          <aside class="article-sidebar">
            @if (relatedArticles().length > 0) {
              <section class="sidebar-section topic-related">
                <h3>More on this Topic</h3>
                <div class="sidebar-item" *ngFor="let item of relatedArticles().slice(0, 4); let i = index" [routerLink]="['/article', item.id]">
                  <div class="item-content">
                    <span class="item-title">{{ item.title }}</span>
                    <div class="item-meta">{{ item.source?.name | uppercase }} | {{ item.category || 'GENERAL' }}</div>
                  </div>
                </div>
                <div class="sidebar-divider"></div>
              </section>
            }

            <section class="sidebar-section">
              <h3>Trending News</h3>
              @if (trendingArticles().length > 0) {
                <div class="sidebar-item" *ngFor="let item of trendingArticles().slice(0, 5); let i = index" [routerLink]="['/article', item.id]">
                  <span class="item-rank">{{ (i + 1) < 10 ? '0' + (i + 1) : (i + 1) }}</span>
                  <div class="item-content">
                    <span class="item-title">{{ item.title }}</span>
                    <div class="item-meta">{{ item.source?.name | uppercase }} | {{ item.category || 'GENERAL' }}</div>
                    
                    <div class="trending-labels">
                      @if (item.isSpike) {
                        <span class="trending-pill spike">🔥 Sudden Spike</span>
                      }
                      @if (item.isMultiSource) {
                        <span class="trending-pill multi">🌐 Multi-Source</span>
                      }
                      @if (item.isHot) {
                        <span class="trending-pill hot">📈 Hot</span>
                      }
                    </div>
                  </div>
                </div>
                <app-ad-slot placementType="sidebar"></app-ad-slot>
              } @else {
                <div class="loading-sidebar">
                  <div class="mini-spinner"></div>
                </div>
              }
            </section>
          </aside>
        </div>

        <!-- Related News Section (Card Style) -->
        @if (relatedArticles().length > 0) {
          <section class="related-news-section">
            <div class="section-container">
              <div class="section-header">
                <div class="header-line"></div>
                <h2>Related Stories from Other Publishers</h2>
                <p>Explore different perspectives on this story from our global network.</p>
              </div>

              <div class="related-grid">
                <div class="related-card" *ngFor="let item of relatedArticles()" [routerLink]="['/article', item.id]">
                  <div class="card-image-box">
                    <img [src]="item.imageUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000'" 
                         (error)="handleImageError($event)" alt="">
                    <div class="source-badge">{{ item.source?.name }}</div>
                  </div>
                  <div class="card-content">
                    <div class="card-meta">
                      <span class="category">{{ item.category || 'General' | uppercase }}</span>
                      <span class="dot"></span>
                      <span class="date">{{ formatDate(item.postedAt) }}</span>
                    </div>
                    <h3 class="card-title">{{ item.title }}</h3>
                    <p class="card-excerpt">{{ item.synopsis || 'No summary available...' | slice:0:120 }}...</p>
                    <button class="btn-read-story">
                      READ STORY
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        }
      } @else if (isLoading()) {
        <div class="loading-screen">
          <div class="premium-spinner"></div>
          <p>AUTHENTICATING PREMIUM ACCESS...</p>
        </div>
      }
      <app-footer></app-footer>
    </div>
  `,
  styleUrl: './article-detail.scss'
})
export class ArticleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  public auth = inject(AuthService); // Changed to public as used in template
  private accessService = inject(AccessService);

  article = signal<any>(null);
  relatedArticles = signal<any[]>([]);
  trendingArticles = signal<any[]>([]);
  isLoading = signal(true);
  readingProgress = signal(0);
  hasPremiumAccess = signal(false);
  logoError = signal(false);

  constructor() { }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    this.readingProgress.set((scrollOffset / scrollHeight) * 100);
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchArticle(id);
        this.fetchTrending();
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  fetchArticle(id: string) {
    this.isLoading.set(true);
    this.logoError.set(false);
    window.scrollTo(0, 0);
    
    this.http.get<any>(`http://localhost:3000/articles/${id}`).subscribe({
      next: (foundData) => {
        this.article.set(foundData.article || foundData);
        this.relatedArticles.set(foundData.relatedArticles || []);
        this.isLoading.set(false);

        // Deduct credit if user is logged in
        if (this.auth.isAuthenticated()) {
          this.deductCredit(id);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.router.navigate(['/']);
        this.isLoading.set(false);
      }
    });
  }

  deductCredit(articleId: string) {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    this.http.post<any>('http://localhost:3000/auth/deduct-credits', { userId, articleId }).subscribe({
      next: (updatedUser) => {
        // Update the global user state with new balance
        this.auth.currentUser.set(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    });
  }

  handleLogoError() {
    this.logoError.set(true);
  }

  getLogoUrl(): string {
    const url = this.article()?.source?.homepageUrl || this.article()?.sourceUrl;
    if (!url) return '';
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`;
    } catch {
      return '';
    }
  }

  fetchTrending() {
    this.http.get<any[]>('http://localhost:3000/articles/trending').subscribe({
      next: (res) => {
        this.trendingArticles.set(res || []);
      },
      error: (err) => {
        console.error('[ArticleDetail] Error fetching trending:', err);
        // Fallback to latest articles if API fails
        this.http.get<any[]>('http://localhost:3000/articles').subscribe({
          next: (articles) => this.trendingArticles.set(articles || [])
        });
      }
    });
  }

  getSourceColor(): string {
    const name = this.article()?.source?.name?.toLowerCase();
    if (!name) return '#900';
    if (name.includes('ht media') || name.includes('hindustan times')) return '#d32f2f';
    if (name.includes('bbc')) return '#bb1919';
    if (name.includes('reuters')) return '#ff8000';
    if (name.includes('techcrunch')) return '#02ad4c';
    if (name.includes('verge')) return '#e5127d';
    return '#900';
  }

  getFaviconUrl(): string {
    const url = this.article()?.sourceUrl;
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
    } catch {
      return '';
    }
  }


  handleImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000';
  }

  formatDate(date: string) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getReadingTime(): number {
    const text = this.article()?.synopsis || '';
    const wordCount = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
