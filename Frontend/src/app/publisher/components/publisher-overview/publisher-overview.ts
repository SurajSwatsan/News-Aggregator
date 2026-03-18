import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-publisher-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publisher-overview.html',
  styleUrl: './publisher-overview.css'
})
export class PublisherOverviewComponent implements OnInit {
  private http = inject(HttpClient);
  
  metrics = signal([
    { label: 'Total Articles', value: '0', icon: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z M14.5 2v6h6' },
    { label: 'Total Views', value: '0', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z' },
    { label: 'Estimated Revenue', value: '₹0', icon: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    { label: 'Active Readers', value: '0', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 1 0-8 4 4 0 0 1 0 8z' }
  ]);

  ngOnInit() {
    this.loadStats();
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
