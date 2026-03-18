import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-publisher-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publisher-analytics.html',
  styleUrl: './publisher-analytics.css'
})
export class PublisherAnalyticsComponent implements OnInit {
  private http = inject(HttpClient);

  // Advanced metrics
  detailedMetrics = signal([
    { label: 'Avg. Read Time', value: '4m 12s', trend: '+8%', icon: 'clock' },
    { label: 'Retention Rate', value: '64.2%', trend: '+3.1%', icon: 'users' },
    { label: 'Social Shares', value: '12.4K', trend: '+15%', icon: 'share' },
    { label: 'Bounce Rate', value: '28.4%', trend: '-2.5%', icon: 'arrow-down' }
  ]);

  topArticles = signal([
    { title: 'The Future of AI in Modern Journalism', views: '12.4K', shares: '2.1K', conversion: '4.2%' },
    { title: 'Global Economic Shift: 2026 Outlook', views: '10.8K', shares: '1.8K', conversion: '3.8%' },
    { title: 'Sustainable Cities: Beyond the Hype', views: '9.2K', shares: '1.5K', conversion: '3.5%' }
  ]);

  deviceBreakdown = signal([
    { device: 'Mobile', flat: '68%', color: '#2563eb' },
    { device: 'Desktop', flat: '24%', color: '#3b82f6' },
    { device: 'Tablet', flat: '8%', color: '#93c5fd' }
  ]);

  trafficData = signal<any[]>([]);

  ngOnInit() {
    this.loadAnalytics();
  }

  loadAnalytics() {
    const baseUrl = 'http://localhost:3000/publisher';
    this.http.get(`${baseUrl}/analytics`).subscribe((res: any) => {
      this.trafficData.set(res);
      // In a real scenario, we'd update bars/charts based on this
    });
  }
}
