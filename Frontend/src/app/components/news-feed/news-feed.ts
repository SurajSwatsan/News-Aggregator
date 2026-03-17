import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-news-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './news-feed.html',
  styleUrl: './news-feed.css'
})
export class NewsFeedComponent implements OnInit {
  private http = inject(HttpClient);
  articles = signal<any[]>([]);
  isLoading = signal(true);
  selectedCategory = signal<string>('All');
  
  categories = [
    'All', 'World', 'Politics', 'Business', 'Technology', 
    'Science', 'Health', 'Sports', 'Entertainment', 'Lifestyle'
  ];

  ngOnInit() {
    this.fetchArticles();
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
    this.isLoading.set(true);
    this.fetchArticles();
  }

  fetchArticles() {
    let url = 'http://localhost:3000/articles';
    if (this.selectedCategory() !== 'All') {
      url += `?category=${this.selectedCategory()}`;
    }
    
    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.articles.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
