import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-ad-slot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ad-slot.html',
  styleUrl: './ad-slot.scss'
})
export class AdSlotComponent implements OnInit {
  private http = inject(HttpClient);

  @Input() placementType: string = 'sidebar'; // 'header', 'sidebar', 'in-feed'
  @Input() index: number = 0; // To support rotation (0, 1, 2, ...)
  
  ad = signal<any>(null);
  isLoading = signal(true);

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

  handleMediaError() {
    // If media fails to load, gracefully degrade to 'text' style
    const currentAd = this.ad();
    if (currentAd) {
      this.ad.set({ ...currentAd, adType: 'text' });
    }
  }
}
