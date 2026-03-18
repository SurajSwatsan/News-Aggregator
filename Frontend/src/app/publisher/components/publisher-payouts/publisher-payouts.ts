import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-publisher-payouts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publisher-payouts.html',
  styleUrl: './publisher-payouts.css'
})
export class PublisherPayoutsComponent implements OnInit {
  // Payout Summary Metrics
  summaryMetrics = signal([
    { label: 'Available for Payout', value: '₹12,400', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Total Paid Out', value: '₹84,500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Next Payout Date', value: 'Apr 01, 2026', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
  ]);

  payoutHistory = signal([
    { id: 'PAY-8829-X1', date: 'Mar 01, 2026', amount: '₹18,210', method: 'HDFC Bank (****5678)', status: 'Completed' },
    { id: 'PAY-7712-Q4', date: 'Feb 01, 2026', amount: '₹16,548', method: 'HDFC Bank (****5678)', status: 'Completed' },
    { id: 'PAY-6601-M9', date: 'Jan 01, 2026', amount: '₹14,015', method: 'UPI (news.pub@okaxis)', status: 'Completed' },
    { id: 'PAY-5590-Z3', date: 'Dec 01, 2025', amount: '₹12,850', method: 'UPI (news.pub@okaxis)', status: 'Completed' }
  ]);

  ngOnInit() {}
}
