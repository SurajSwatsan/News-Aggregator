import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SafeHtmlPipe } from '../../../pipes/safe-html.pipe';
import { SocketService } from '../../../services/socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-publisher-articles',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: './publisher-articles.html',
  styleUrl: './publisher-articles.css'
})
export class PublisherArticlesComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);
  private syncSubscription?: Subscription;
  
  articles = signal<any[]>([]);
  showArticleModal = signal(false);
  synopsisFilled = signal(false);
  selectedImage = signal<string | null>(null);
  isSyncing = signal(false);

  ngOnInit() {
    this.loadArticles();
    
    // Auto-sync on page load
    this.syncFeeds(true);

    // Listen for real-time updates
    this.syncSubscription = this.socketService.onSyncComplete().subscribe((data) => {
      console.log('Refreshing articles due to background sync completion');
      this.loadArticles();
      this.isSyncing.set(false);
    });
  }

  ngOnDestroy() {
    if (this.syncSubscription) {
      this.syncSubscription.unsubscribe();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImage.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  applyFormat(event: any) {
    const tag = event.target.value;
    document.execCommand('formatBlock', false, tag);
    // Reset to p (Normal) after applying to allow re-selection if needed
    // But actually, it's better to leave it or set it back in HTML.
  }

  loadArticles() {
    const baseUrl = 'http://localhost:3000/publisher';
    this.http.get(`${baseUrl}/articles`).subscribe((res: any) => {
      // Merge backend data with mock data, putting backend data first
      if (Array.isArray(res) && res.length > 0) {
        this.articles.update(prev => [...res, ...prev.filter(p => !res.find((r: any) => r.title === p.title))]);
      }
    });
  }

  createArticle(data: any) {
    const baseUrl = 'http://localhost:3000/publisher';
    this.http.post(`${baseUrl}/articles`, data).subscribe((res: any) => {
      this.articles.update(prev => [res, ...prev]);
      this.showArticleModal.set(false);
      this.selectedImage.set(null);
    });
  }

  syncFeeds(silent = false) {
    this.isSyncing.set(true);
    const baseUrl = 'http://localhost:3000/publisher';
    this.http.post(`${baseUrl}/sync`, {}).subscribe({
      next: (res: any) => {
        if (!silent) alert(res.message);
        // Note: isSyncing is now handled by the WebSocket event for silent mode
        if (!silent) {
          // If manually triggered, we wait for the WS or let it finish
          // But for now, we'll keep the spinner until WS hits or timeout
        }
      },
      error: () => {
        if (!silent) alert('Sync failed. Please check your RSS feed URL in settings.');
        this.isSyncing.set(false);
      }
    });
  }

  formatDate(date: string) {
    if (!date) return 'Recently';
    return new Date(date).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }
}
