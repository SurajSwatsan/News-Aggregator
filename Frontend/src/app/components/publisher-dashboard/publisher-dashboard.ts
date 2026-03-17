import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-publisher-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publisher-dashboard.html',
  styleUrl: './publisher-dashboard.css'
})
export class PublisherDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  activeTab = signal<'dashboard' | 'articles' | 'analytics' | 'revenue' | 'payouts'>('dashboard');
  user = computed(() => this.authService.currentUser());
  
  stats = signal<any>(null);
  articles = signal<any[]>([]);
  analytics = signal<any[]>([]);
  revenue = signal<any>(null);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    const baseUrl = 'http://localhost:3000/publisher';
    
    this.http.get(`${baseUrl}/dashboard`).subscribe(res => this.stats.set(res));
    this.http.get(`${baseUrl}/articles`).subscribe((res: any) => this.articles.set(res));
    this.http.get(`${baseUrl}/analytics`).subscribe((res: any) => this.analytics.set(res));
    this.http.get(`${baseUrl}/revenue`).subscribe(res => this.revenue.set(res));
  }

  switchTab(tab: any) {
    this.activeTab.set(tab);
  }

  onLogout() {
    this.authService.logout();
  }

  formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
