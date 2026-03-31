import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-publisher-articles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publisher-articles.html',
  styleUrl: './publisher-articles.css'
})
export class PublisherArticlesComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  
  articles = signal<any[]>([]);
  rssUrl = signal<string>('');
  originalRssUrl = '';
  showArticleModal = signal(false);
  synopsisFilled = signal(false);
  selectedImage = signal<string | null>(null);
  searchQuery = signal<string>('');

  ngOnInit() {
    this.loadArticles();
    this.loadRssUrl();
  }

  loadRssUrl() {
    this.http.get('http://localhost:3000/publisher/feeds').subscribe((res: any) => {
      if (Array.isArray(res) && res.length > 0) {
        this.rssUrl.set(res[0].url);
        this.originalRssUrl = res[0].url;
      }
    });
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
    const params: any = {};
    if (this.searchQuery()) {
      params.search = this.searchQuery();
    }

    this.http.get(`${baseUrl}/articles`, { params }).subscribe((res: any) => {
      // Merge backend data with mock data, putting backend data first
      if (Array.isArray(res)) {
        if (this.searchQuery()) {
          // If searching, only show backend results
          this.articles.set(res);
        } else {
          this.articles.update(prev => [...res, ...prev.filter(p => !res.find((r: any) => r.title === p.title))]);
        }
      }
    });
  }

  onSearchChange(event: any) {
    this.searchQuery.set(event.target.value);
    this.loadArticles();
  }

  createArticle(data: any) {
    const baseUrl = 'http://localhost:3000/publisher';
    
    // Patch RSS URL if changed
    if (this.rssUrl() && this.rssUrl() !== this.originalRssUrl) {
      this.http.post(`${baseUrl}/feeds`, { url: this.rssUrl() }).subscribe(() => {
        this.originalRssUrl = this.rssUrl();
        this.toast.show('RSS Feed URL updated successfully', 'success');
      });
    }

    this.http.post(`${baseUrl}/articles`, data).subscribe((res: any) => {
      this.articles.update(prev => [res, ...prev]);
      this.showArticleModal.set(false);
      this.selectedImage.set(null);
      this.toast.show('Article published successfully!', 'success');
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
