import { Component, Input, OnInit, inject, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-ad-slot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ad-slot.html',
  styleUrl: './ad-slot.scss'
})
export class AdSlotComponent implements OnInit {
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);

  @Input() placementType: string = 'sidebar'; // 'header', 'sidebar', 'in-feed'
  @Input() index: number = 0; // To support rotation (0, 1, 2, ...)
  @Input() showLabel: boolean = false;
  
  ad = signal<any>(null);
  isLoading = signal(true);
  isPaused = signal(false);

  @ViewChild('adVideo') adVideo!: ElementRef<HTMLVideoElement>;

  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnInit() {
    this.fetchAd();
  }

  fetchAd() {
    this.http.get<any[]>(`http://localhost:3000/ads/active?placement=${this.placementType}`).subscribe({
      next: (ads) => {
        if (ads && ads.length > 0) {
          // Use the index to rotate through available ads
          const adIndex = this.index % ads.length;
          this.ad.set(ads[adIndex]);
          this.trackImpression(ads[adIndex].id);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
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

    // Prevent navigation when toggling video
    event.stopPropagation();
    
    if (this.isPaused()) {
      video.play().then(() => {
        this.isPaused.set(false);
      }).catch(err => {
        console.error('Playback failed:', err);
      });
    } else {
      video.pause();
      this.isPaused.set(true);
    }
  }

  onVideoLoaded(event: Event) {
    const video = event.target as HTMLVideoElement;
    if (video) {
      video.muted = true; // Ensure muted for autoplay
      video.play().then(() => {
        this.isPaused.set(false);
      }).catch(err => {
        console.warn('Initial autoplay failed, user interaction may be required:', err);
        // We keep isPaused(false) initially to hide the overlay, 
        // but if it strictly fails, we might need to show it.
        // For now, let's try to be optimistic.
      });
    }
  }

  handleMediaError() {
    // If media fails to load, gracefully degrade to 'text' style
    const currentAd = this.ad();
    if (currentAd) {
      this.ad.set({ ...currentAd, adType: 'text' });
    }
  }
}
