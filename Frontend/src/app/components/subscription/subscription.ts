import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth';
import { FooterComponent } from '../common/footer/footer';
import { PaymentModalComponent } from '../payment-modal/payment-modal';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FooterComponent, PaymentModalComponent],
  templateUrl: './subscription.html',
  styleUrls: ['./subscription.scss']
})
export class SubscriptionComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public auth = inject(AuthService);

  plans = signal<any[]>([]);
  activeSubscription = signal<any>(null);
  returnUrl = signal<string | null>(null);

  constructor() {
    this.route.queryParams.subscribe(params => {
      this.returnUrl.set(params['returnUrl'] || null);
    });
  }

  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
    this.fetchActiveSubscription();
  }

  fetchActiveSubscription() {
    this.http.get<any>('http://localhost:3000/payment/my-transaction').subscribe({
      next: (data) => {
        if (data && data.plan) {
          this.activeSubscription.set(data);
        } else {
          this.fetchPlans();
        }
      },
      error: () => this.fetchPlans()
    });
  }

  fetchPlans() {
    this.http.get<any[]>('http://localhost:3000/subscription-plans').subscribe({
      next: (data) => {
        const active = data.filter(p => p.isActive);
        this.plans.set(active);
      },
      error: (err) => console.error('Failed to load plans:', err)
    });
  }

  getFrequencyData(plan: any, freq: string) {
    return plan.subscriptions?.find((s: any) => s.frequency === freq);
  }

  purchasePlan(plan: any, freq: string) {
    this.router.navigate(['/payment'], { 
      queryParams: { 
        planId: plan.id, 
        freq: freq,
        returnUrl: this.returnUrl() 
      } 
    });
  }

  goBack() {
    const url = this.returnUrl();
    if (url) {
      this.router.navigateByUrl(url);
    } else {
      this.router.navigate(['/']);
    }
  }
}
