import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-publisher-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publisher-overview.html',
  styleUrl: './publisher-overview.css'
})
export class PublisherOverviewComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private router = inject(Router);
  
  view = signal<'dashboard' | 'feeds' | 'settings'>('dashboard');
  
  // Dashboard Metrics
  metrics = signal([
    { label: 'Total Articles', value: '0', icon: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z M14.5 2v6h6' },
    { label: 'Total Views', value: '1,245', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
    { label: 'Estimated Revenue', value: '₹124.50', icon: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    { label: 'Active Readers', value: '42', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 1 0-8 4 4 0 0 1 0 8z' }
  ]);

  // Feeds/Settings Data
  source = signal<any>({ name: '', url: '', description: '' });
  feeds = signal<any[]>([]);
  newFeedUrl = '';
  isSaving = signal(false);
  isSyncing = signal(false);

  ngOnInit() {
    this.detectView();
    this.loadStats();
    this.loadSourceDetails();
    this.loadFeeds();
  }

  detectView() {
    const url = this.router.url;
    if (url.includes('/publisher/feeds')) {
      this.view.set('feeds');
    } else if (url.includes('/publisher/settings')) {
      this.view.set('settings');
    } else {
      this.view.set('dashboard');
    }
  }

  loadSourceDetails() {
    this.http.get('http://localhost:3000/publisher/source').subscribe((res: any) => {
      this.source.set(res);
    });
  }

  loadFeeds() {
    this.http.get('http://localhost:3000/publisher/feeds').subscribe((res: any) => {
      this.feeds.set(res);
    });
  }

  updateSource() {
    this.isSaving.set(true);
    this.http.put('http://localhost:3000/publisher/source', this.source()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toast.show('Settings updated successfully!');
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.show('Failed to update settings.', 'error');
      }
    });
  }

  addFeed() {
    if (!this.newFeedUrl) return;
    this.isSaving.set(true);
    this.http.post('http://localhost:3000/publisher/feeds', { url: this.newFeedUrl }).subscribe({
      next: () => {
        this.newFeedUrl = '';
        this.loadFeeds();
        this.isSaving.set(false);
      },
      error: () => {
        this.isSaving.set(false);
        this.toast.show('Failed to add feed.', 'error');
      }
    });
  }

  triggerSync() {
    this.isSyncing.set(true);
    this.http.post('http://localhost:3000/publisher/sync', {}).subscribe({
      next: (res: any) => {
        this.toast.show(res.message);
        this.isSyncing.set(false);
      },
      error: () => {
        this.isSyncing.set(false);
        this.toast.show('Sync failed. Please check your RSS URL.', 'error');
      }
    });
  }

  loadStats() {
    const baseUrl = 'http://localhost:3000/publisher';
    this.http.get(`${baseUrl}/dashboard`).subscribe((res: any) => {
      if (res && res.stats) {
        this.metrics.update(prev => [
          { ...prev[0], value: res.stats.articles.toLocaleString() },
          { ...prev[1], value: res.stats.totalViews.toLocaleString() },
          { ...prev[2], value: `₹${res.stats.revenue.toLocaleString()}` },
          { ...prev[3], value: res.stats.activeReaders.toLocaleString() }
        ]);
      }
    });
  }
}
