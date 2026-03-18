import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-publisher-revenue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publisher-revenue.html',
  styleUrl: './publisher-revenue.css'
})
export class PublisherRevenueComponent implements OnInit {
  private http = inject(HttpClient);

  // Financial metrics
  revenueMetrics = signal([
    { label: 'Total Earned', value: '₹0', trend: '+0%', icon: 'M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
    { label: 'Pending Payout', value: '₹0', trend: 'Processing', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Avg. RPM', value: '₹0', trend: '+0%', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { label: 'Ad Revenue', value: '₹0', trend: '0% of total', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' }
  ]);

  currentBalance = signal('0.00');
  pendingPayoutValue = signal('0.00');

  earningHistory = signal([
    { period: 'March 2026', views: '45.2K', rpm: '₹425', earned: '₹19,210', status: 'Processing' },
    { period: 'February 2026', views: '42.8K', rpm: '₹410', earned: '₹17,548', status: 'Paid' },
    { period: 'January 2026', views: '38.5K', rpm: '₹390', earned: '₹15,015', status: 'Paid' }
  ]);

  payoutMethods = signal([
    { type: 'Bank Transfer', details: 'HDFC Bank ****5678', status: 'Primary' },
    { type: 'UPI', details: 'news.pub@okaxis', status: 'Secondary' }
  ]);

  ngOnInit() {
    this.loadRevenue();
  }

  loadRevenue() {
    const baseUrl = 'http://localhost:3000/publisher';
    this.http.get(`${baseUrl}/revenue`).subscribe((res: any) => {
      if (res) {
        this.currentBalance.set(res.currentBalance);
        this.pendingPayoutValue.set(res.pendingPayout);
        
        this.revenueMetrics.update(prev => [
          { ...prev[0], value: `₹${res.totalEarned}` },
          { ...prev[1], value: `₹${res.pendingPayout}` },
          { ...prev[2], value: `₹${(parseFloat(res.totalEarned) / 100).toFixed(0)}` }, // Mock RPM calc
          { ...prev[3], value: `₹${(parseFloat(res.totalEarned) * 0.75).toFixed(0)}` }   // Mock Ad Rev calc
        ]);
      }
    });
  }
}
