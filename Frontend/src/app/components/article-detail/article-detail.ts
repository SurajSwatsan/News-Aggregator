import { Component, OnInit, inject, signal, HostListener, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { AuthService } from '../../auth/auth';
import { AccessService } from '../../services/access.service';
import { FooterComponent } from '../common/footer/footer';
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
              <span class="nav-source" [routerLink]="['/source', article()?.source?.id]" style="cursor: pointer;">{{ article()?.source?.name }}</span>
              <span class="premium-badge-nav">PREMIUM</span>
              
              <div class="nav-pipe">|</div>
              
              <!-- Credits Badge (Interactive) -->
              <div class="credits-badge" *ngIf="auth.isAuthenticated()" (click)="onCreditClick()" style="cursor: pointer;">
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
                      <span class="byline">Published by <strong [routerLink]="['/source', article()?.source?.id]" style="cursor: pointer; color: var(--profile-accent);">{{ article().source?.name }} Editorial</strong></span>
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
                  <button (click)="onReadFullStory($event)" class="btn-full-story" [disabled]="isRedirecting()">
                    {{ isRedirecting() ? 'AUTHENTICATING...' : 'READ ON ' + (article().source?.name | uppercase) }}
                    <svg *ngIf="!isRedirecting()" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <div *ngIf="isRedirecting()" class="mini-spinner-white"></div>
                  </button>
                </div>
              </div>
            </article>
            <app-ad-slot placementType="header"></app-ad-slot>
          </main>

          <!-- Sidebar -->
          <aside class="article-sidebar">
            @if (relatedArticles().length > 0) {
              <section class="sidebar-section topic-related">
                <h3>Related More News</h3>
                <div class="sidebar-item" *ngFor="let item of filteredRelatedArticles().slice(0, 6); let i = index" [routerLink]="['/article', item.id]">
                  <div class="item-content">
                    <span class="item-title">{{ item.title }}</span>
                    <div class="item-meta">
                      {{ item.source?.name | uppercase }} | {{ item.category || 'GENERAL' }}
                      <span class="other-source-tag" *ngIf="item.clusterId === article()?.clusterId">OTHER SOURCE</span>
                    </div>
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
                <app-ad-slot placementType="sidebar" [index]="0"></app-ad-slot>
                <div style="margin-top: 20px;"></div>
                <app-ad-slot placementType="sidebar" [index]="1"></app-ad-slot>
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

      <!-- Premium Paywall Modal -->
      <div class="paywall-overlay" *ngIf="showPaywallModal()" (click)="showPaywallModal.set(false)">
        <div class="paywall-card animate-zoom-in" (click)="$event.stopPropagation()">
          <div class="paywall-header">
            <div class="paywall-badge-row">
              <span class="premium-label">PREMIUM REQUIRED</span>
              <div class="user-credits-mini" *ngIf="auth.currentUser()">
                <svg viewBox="0 0 24 24" width="12" height="12"><path d="M12 2L2 12l10 10 10-10L12 2z" fill="currentColor" /></svg>
                {{ auth.currentUser()?.creditBalance || 0 }} CREDITS
              </div>
            </div>
            <h2>Elevate Your Perspective</h2>
            <p>Join our elite network to unlock unlimited investigations and expert analysis.</p>
            <button class="paywall-close-x" (click)="showPaywallModal.set(false)">&times;</button>
          </div>
          
          <div class="paywall-plans-container">
            <!-- Frequency Switcher -->
            <div class="frequency-tabs">
              <button [class.active]="selectedFrequency() === 'monthly'" (click)="setFrequency('monthly')">MONTHLY</button>
              <button [class.active]="selectedFrequency() === 'quarterly'" (click)="setFrequency('quarterly')">QUARTERLY</button>
              <button [class.active]="selectedFrequency() === 'yearly'" (click)="setFrequency('yearly')">YEARLY</button>
            </div>

            <div class="plans-grid">
              <div *ngFor="let plan of plans()" class="plan-mini-card">
                <ng-container *ngIf="getFrequencyData(plan, selectedFrequency()) as subData">
                  <div class="plan-info">
                    <span class="plan-name">{{ plan.name }}</span>
                    <div class="plan-price">
                      <span class="currency">₹</span>
                      <span class="amount">{{ subData.price }}</span>
                      <span class="period">/{{ selectedFrequency() === 'monthly' ? 'mo' : (selectedFrequency() === 'quarterly' ? 'qtr' : 'yr') }}</span>
                    </div>
                    <span class="plan-credits"><strong>{{ subData.credits }}</strong> Credits</span>
                  </div>
                  <button class="btn-select-plan" (click)="purchasePlan(plan, selectedFrequency())" [disabled]="isProcessing()">
                    {{ isProcessing() ? 'PROCESSING...' : 'CHOOSE PLAN' }}
                  </button>
                </ng-container>
              </div>
            </div>
          </div>

          <div class="paywall-footer">
            <button class="btn-link" (click)="showPaywallModal.set(false)">CONTINUE AS READER (SUMMARY ONLY)</button>
          </div>

          <!-- Processing Overlay (Internal to Modal) -->
          <div class="modal-processing-overlay" *ngIf="isProcessing()">
            <div class="spinner-container">
              <div class="premium-spinner"></div>
              <p>Securing Access...</p>
            </div>
          </div>
        </div>
      </div>
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
  
  // New computed signal to filter out SAME-SOURCE duplicates but ALLOW different-source duplicates
  filteredRelatedArticles = computed(() => {
    const current = this.article();
    if (!current) return [];
    
    return this.relatedArticles().filter(item => {
      // If it's a different story entirely, keep it
      if (item.clusterId !== current.clusterId) return true;
      
      // If it's the SAME story, only show it if it's from a DIFFERENT source
      return item.sourceId !== current.sourceId;
    });
  });

  isLoading = signal(true);
  isRedirecting = signal(false);
  showPaywallModal = signal(false);
  readingProgress = signal(0);
  hasPremiumAccess = signal(false);
  logoError = signal(false);
  
  // New subscription signals
  plans = signal<any[]>([]);
  isProcessing = signal(false);
  selectedFrequency = signal<string>('monthly');

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
        this.fetchPlans();
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  fetchArticle(id: string) {
    this.isLoading.set(true);
    this.logoError.set(false);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    
    this.http.get<any>(`http://localhost:3000/articles/${id}`).subscribe({
      next: (foundData) => {
        this.article.set(foundData.article || foundData);
        this.relatedArticles.set(foundData.relatedArticles || []);
        this.isLoading.set(false);

        // Auto-trigger paywall if credits are finished
        if (this.auth.isAuthenticated() && Number(this.auth.currentUser()?.creditBalance || 0) < 1) {
          setTimeout(() => {
            this.showPaywallModal.set(true);
          }, 1000);
        }
      },
      error: () => {
        this.router.navigate(['/']);
        this.isLoading.set(false);
      }
    });
  }

  onReadFullStory(event: Event) {
    event.preventDefault();
    const articleId = this.article()?.id;
    const sourceUrl = this.article()?.sourceUrl;
    
    if (!articleId || !sourceUrl) return;

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.isRedirecting.set(true);

    // 1. Check if already has access
    this.accessService.checkAccess(articleId).subscribe(hasAccess => {
      if (hasAccess) {
        // Already paid, just navigate
        window.location.href = sourceUrl;
      } else {
        // 2. Need to pay - check balance
        const balance = Number(this.auth.currentUser()?.creditBalance || 0);

        if (balance >= 1) {
          this.accessService.grantAccess(articleId).subscribe(success => {
            if (success) {
              // Pulse the credit count and wait a second so user can see it "minimise"
              setTimeout(() => {
                window.location.href = sourceUrl;
              }, 1200);
            } else {
              this.isRedirecting.set(false);
              alert('Failed to process your request. Please try again.');
            }
          });
        } else {
          this.isRedirecting.set(false);
          this.showPaywallModal.set(true);
        }
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

  onCreditClick() {
    const balance = Number(this.auth.currentUser()?.creditBalance || 0);
    if (balance < 1) {
      this.showPaywallModal.set(true);
    } else {
      this.showPaywallModal.set(true); // Always show plans in the modal for now as requested
    }
  }

  fetchPlans() {
    this.http.get<any[]>('http://localhost:3000/subscription-plans').subscribe({
      next: (data) => {
        const active = data.filter(p => p.isActive);
        this.plans.set(active);
      },
      error: (err) => console.error('Failed to load plans:', err)
    });
  }

  getFrequencyData(plan: any, freq: string) {
    return plan.subscriptions?.find((s: any) => s.frequency === freq);
  }

  purchasePlan(plan: any, freq: string) {
    const subData = this.getFrequencyData(plan, freq);
    if (!subData) return;

    this.isProcessing.set(true);
    this.accessService.addCredits(subData.credits).subscribe({
      next: () => {
        setTimeout(() => {
          this.isProcessing.set(false);
          this.showPaywallModal.set(false);
          // Show a success message or just proceed
          this.onReadFullStory(new MouseEvent('click'));
        }, 1500);
      },
      error: (err: any) => {
        console.error('Purchase failed:', err);
        this.isProcessing.set(false);
        alert('Payment processing failed. Please try again.');
      }
    });
  }

  setFrequency(freq: string) {
    this.selectedFrequency.set(freq);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
