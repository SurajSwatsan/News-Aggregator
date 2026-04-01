import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AccessService } from '../../services/access.service';
import { AuthService } from '../../auth/auth';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription.html',
  styleUrls: ['./subscription.scss']
})
export class SubscriptionComponent {
  private accessService = inject(AccessService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public auth = inject(AuthService);

  isProcessing = signal(false);
  plans = signal<any[]>([]);
  returnUrl = signal<string | null>(null);

  constructor() {
    this.route.queryParams.subscribe(params => {
      this.returnUrl.set(params['returnUrl'] || null);
    });
  }

  ngOnInit() {
    this.fetchPlans();
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
    const subData = this.getFrequencyData(plan, freq);
    if (!subData) {
      alert('This frequency is not available for this plan.');
      return;
    }

    this.processPurchase(this.accessService.addCredits(subData.credits));
  }

  private processPurchase(obs: any) {
    this.isProcessing.set(true);
    obs.subscribe({
      next: () => {
        setTimeout(() => {
          this.isProcessing.set(false);
          const url = this.returnUrl();
          if (url) {
            this.router.navigateByUrl(url);
          } else {
            this.router.navigate(['/']);
          }
        }, 1500); // Simulate processing time
      },
      error: (err: any) => {
        console.error('Purchase failed:', err);
        this.isProcessing.set(false);
        alert('Payment processing failed. Please try again.');
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
