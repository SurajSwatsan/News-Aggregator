import { Component, Input, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, NgZone, PLATFORM_ID, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-ad-slot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ad-slot.html',
  styleUrl: './ad-slot.scss'
})
export class AdSlotComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private zone = inject(NgZone);
  private platformId = inject(PLATFORM_ID);
  private refreshInterval: any;
  private rotationOffset = 0;
  private cachedAds: any[] = [];

  @Input() placementType: string = 'sidebar'; // 'header', 'sidebar', 'in-feed'
  @Input() index: number = 0; // To support rotation (0, 1, 2, ...)
  @Input() showLabel: boolean = false;
  @Input() excludeVideo: boolean = false;
  
  ad = signal<any>(null);
  sanitizedMediaUrl = signal<SafeResourceUrl | null>(null);
  isLoading = signal(true);
  isFading = signal(false);
  isPaused = signal(false);

  @ViewChild('adVideo') adVideo!: ElementRef<HTMLVideoElement>;

  constructor() {
    // Automatically update sanitized URL whenever the ad changes
    effect(() => {
      const currentAd = this.ad();
      if (currentAd?.mediaUrl) {
        // Pre-sanitize to prevent "SafeValue" template errors
        this.sanitizedMediaUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(currentAd.mediaUrl));
      } else {
        this.sanitizedMediaUrl.set(null);
      }
    });
  }

  ngOnInit() {
    this.fetchAd();
    this.startRotation();
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  startRotation() {
    if (!isPlatformBrowser(this.platformId)) return;

    this.zone.runOutsideAngular(() => {
      this.refreshInterval = setInterval(() => {
        this.zone.run(() => {
          this.rotationOffset++;
          this.fetchAd(true);
        });
      }, 300000);
    });
  }

  fetchAd(smooth: boolean = false) {
    const applyAd = (ads: any[]) => {
      let filteredAds = ads;
      if (this.excludeVideo) {
        filteredAds = ads.filter(a => a.adType !== 'video');
      }

      let finalAds = filteredAds;
      if (this.placementType === 'in-feed' || this.placementType === 'sidebar') {
        const mediaAds = filteredAds.filter(a => a.adType === 'image' || a.adType === 'video');
        finalAds = mediaAds.length > 0 ? mediaAds : filteredAds;
      }

      if (finalAds.length > 0) {
        const adIndex = (this.index + this.rotationOffset) % finalAds.length;
        const selectedAd = { ...finalAds[adIndex] };
        
        if (selectedAd.mediaUrl?.toLowerCase().endsWith('.html') && selectedAd.adType !== 'html') {
          selectedAd.adType = 'html';
        }

        this.ad.set(selectedAd);
        this.trackImpression(selectedAd.id);
        this.isPaused.set(false);
      }
      
      if (smooth) {
        setTimeout(() => this.isFading.set(false), 300);
      }
      this.isLoading.set(false);
    };

    const doFetch = () => {
      this.http.get<any[]>(`http://localhost:3000/ads/active?placement=${this.placementType}`).subscribe({
        next: (ads) => {
          if (ads && ads.length > 0) {
            this.cachedAds = ads;
          }
          applyAd(this.cachedAds.length > 0 ? this.cachedAds : ads);
        },
        error: () => {
          if (this.cachedAds.length > 0) {
            applyAd(this.cachedAds);
          } else {
            this.isLoading.set(false);
            this.isFading.set(false);
          }
        }
      });
    };

    if (smooth) {
      this.isFading.set(true);
      setTimeout(doFetch, 500);
    } else {
      doFetch();
    }
  }

  trackImpression(adId: string) {
    this.http.post(`http://localhost:3000/ads/track/impression/${adId}`, {}).subscribe();
  }

  onAdClick() {
    const ad = this.ad();
    if (!ad) return;
    this.http.post(`http://localhost:3000/admin/ads/${ad.id}/click`, {}).subscribe();
    window.open(ad.targetUrl, '_blank');
  }

  toggleVideo(event: MouseEvent) {
    const video = this.adVideo?.nativeElement;
    if (!video) return;
    event.stopPropagation();
    
    if (video.paused) {
      video.play().then(() => {
        this.isPaused.set(false);
      }).catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Playback failed:', err);
        }
        this.isPaused.set(true);
      });
    } else {
      video.pause();
      this.isPaused.set(true);
    }
  }

  onVideoLoaded(event: Event) {
    const video = event.target as HTMLVideoElement;
    if (video && isPlatformBrowser(this.platformId)) {
      video.muted = true;
      setTimeout(() => {
        video.play().then(() => {
          this.isPaused.set(false);
        }).catch(err => {
          // Silent catch for AbortError (common during rapid navigation/rotation)
          if (err.name !== 'AbortError') {
            console.warn('Initial autoplay failed:', err);
          }
          this.isPaused.set(true);
        });
      }, 50);
    }
  }

  handleMediaError(event?: any) {
    const currentAd = this.ad();
    
    if (this.placementType === 'header' && currentAd?.adType === 'video') {
      console.warn('Header video load error detected:', currentAd.mediaUrl);
      return;
    }

    if (currentAd) {
      this.ad.set({ ...currentAd, adType: 'text' });
    }
  }
}
