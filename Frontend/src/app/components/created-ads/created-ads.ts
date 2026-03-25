import { Component, OnInit, inject, signal, computed, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe, UpperCasePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-created-ads',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TitleCasePipe, UpperCasePipe],
  templateUrl: './created-ads.html',
  styleUrl: './created-ads.scss'
})
export class CreatedAdsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
 
  @Output() createRequested = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<any>();
  @Output() viewRequested = new EventEmitter<any>();

  @Input() set refreshTrigger(val: number) {
    if (val > 0) this.loadAds();
  }

  ads = signal<any[]>([]);
  searchQuery = '';
  filterType = 'all';

  // Stats signals
  totalImpressions = signal(0);
  totalClicks = signal(0);

  filteredAds = computed(() => {
    let list = this.ads();
    
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.targetUrl.toLowerCase().includes(q));
    }

    if (this.filterType !== 'all') {
      list = list.filter(a => a.adType === this.filterType);
    }

    return list;
  });

  ngOnInit() {
    this.loadAds();
  }

  loadAds() {
    this.http.get<any[]>('http://localhost:3000/admin/ads').subscribe({
      next: (res) => {
        this.ads.set(res);
        this.calculateStats(res);
      },
      error: () => this.toast.show('Failed to load campaigns', 'error')
    });
  }

  viewDetails(ad: any) {
    this.viewRequested.emit(ad);
  }

  calculateStats(adsList: any[]) {
    let imps = 0;
    let clicks = 0;
    adsList.forEach(a => {
      imps += (a.impressions || 0);
      clicks += (a.clicks || 0);
    });
    this.totalImpressions.set(imps);
    this.totalClicks.set(clicks);
  }

  calculateCTR(ad: any): string {
    if (!ad.impressions) return '0.00';
    return ((ad.clicks / ad.impressions) * 100).toFixed(2);
  }

  toggleAd(ad: any) {
    this.http.patch(`http://localhost:3000/admin/ads/${ad.id}`, { isActive: !ad.isActive }).subscribe({
      next: () => {
        this.loadAds();
        this.toast.show(ad.isActive ? 'Campaign Paused' : 'Campaign Activated', 'success');
      },
      error: () => this.toast.show('Failed to update campaign status', 'error')
    });
  }

  deleteAd(id: string) {
    if (confirm('Permanently delete this advertising campaign?')) {
      this.http.delete(`http://localhost:3000/admin/ads/${id}`).subscribe({
        next: () => {
          this.toast.show('Campaign deleted', 'success');
          this.loadAds();
        },
        error: () => this.toast.show('Failed to delete campaign', 'error')
      });
    }
  }
}
