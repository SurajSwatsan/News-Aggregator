import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);
  private router = inject(Router);
  
  user = computed(() => this.authService.currentUser());
  activeTab = signal('overview');

  // Dashboard Stats
  totalArticles = signal(1284);
  activeSources = signal(3);
  totalReaders = signal(0);
  revenueShare = signal(4200);
  sourcesAddedToday = signal(0);
  sources = signal<any[]>([]);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.http.get<any>('http://localhost:3000/admin/stats').subscribe(res => {
      this.totalArticles.set(res.totalArticles);
      this.activeSources.set(res.totalSources);
      this.sourcesAddedToday.set(res.sourcesAddedToday);
    });

    this.http.get<any[]>('http://localhost:3000/auth/users').subscribe(res => {
      this.totalReaders.set(res.length);
    });

    this.loadSources();
  }

  loadSources() {
    this.http.get<any[]>('http://localhost:3000/admin/sources').subscribe(res => {
      this.sources.set(res);
    });
  }

  switchTab(tab: string) {
    this.activeTab.set(tab);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
