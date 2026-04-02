import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { UiService } from '../../../services/ui.service';
import { FloatingInputComponent } from '../../../components/common/floating-input/floating-input';
import { FloatingSelectComponent } from '../../../components/common/floating-select/floating-select';

@Component({
  selector: 'app-publisher-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, FloatingInputComponent, FloatingSelectComponent],
  templateUrl: './publisher-articles.html',
  styleUrl: './publisher-articles.css'
})
export class PublisherArticlesComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  protected uiService = inject(UiService);
  
  articles = signal<any[]>([]);
  rssUrl = signal<string>('');
  originalRssUrl = '';
  showArticleModal = signal(false);
  isEditing = signal(false);
  editingArticleId = signal<string | null>(null);
  synopsisFilled = signal(false);
  selectedImage = signal<string | null>(null);
  searchQuery = signal<string>('');
  
  // Form signals for floating components
  articleTitle = signal('');
  articleUrl = signal('');
  selectedCategory = signal('General');

  categoryOptions = [
    { value: 'General', label: 'General' },
    { value: 'Technology', label: 'Technology' },
    { value: 'Business', label: 'Business' },
    { value: 'Politics', label: 'Politics' },
    { value: 'Entertainment', label: 'Entertainment' },
    { value: 'Environment', label: 'Environment' }
  ];

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
      this.closeModal();
      this.toast.show('Article published successfully!', 'success');
    });
  }

  editArticle(article: any) {
    this.isEditing.set(true);
    this.editingArticleId.set(article.id || null);
    this.articleTitle.set(article.title);
    this.articleUrl.set(article.sourceUrl || '');
    this.selectedCategory.set(article.category || 'General');
    this.selectedImage.set(article.imageUrl || null);
    // Note: Synopsis would ideally be set here too if using a viewChild for the editor
    this.openModal();
  }

  openModal() {
    this.showArticleModal.set(true);
    this.uiService.isModalOpen.set(true);
  }

  closeModal() {
    this.showArticleModal.set(false);
    this.isEditing.set(false);
    this.editingArticleId.set(null);
    this.uiService.isModalOpen.set(false);
    this.selectedImage.set(null);
    this.articleTitle.set('');
    this.articleUrl.set('');
    this.selectedCategory.set('General');
  }

  viewOriginal(url: string) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
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
