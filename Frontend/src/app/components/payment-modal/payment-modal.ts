import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth';
import { ToastService } from '../../services/toast.service';
import { Router, ActivatedRoute } from '@angular/router';

declare var Razorpay: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'payment-modal.html',
  styleUrls: ['payment-modal.scss']
})
export class PaymentModalComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public auth = inject(AuthService);

  selectedPlan = signal<any>(null);
  selectedFrequency = signal<string>('');
  returnUrl = signal<string | null>(null);

  isProcessing = signal(false);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const planId = params['planId'];
      const freq = params['freq'];
      const retUrl = params['returnUrl'];

      if (planId && freq) {
        this.selectedFrequency.set(freq);
        this.returnUrl.set(retUrl || null);
        this.fetchPlanDetails(planId);
      } else {
        this.toast.show('Invalid payment context.');
        this.router.navigate(['/subscription']);
      }
    });
  }

  paymentStarted = signal(false);
  isInitializing = signal(true);
  isAutoRedirecting = signal(false);
  paymentSuccess = signal<boolean>(false);
  successData = signal<any>(null); // Store slip details
  transactionId = signal<string | null>(null);

  private fetchPlanDetails(planId: string) {
    this.http.get<any>(`http://localhost:3000/subscription-plans`).subscribe({
      next: (plans) => {
        const plan = plans.find((p: any) => p.id === planId);
        if (plan) {
          this.selectedPlan.set(plan);
          this.isInitializing.set(false);
          // Automatically trigger payment once details are ready
          if (!this.paymentStarted()) {
            this.paymentStarted.set(true);
            this.isAutoRedirecting.set(true);
            this.proceedToPay();
          }
        } else {
          this.toast.show('Plan not found.');
          this.router.navigate(['/subscription']);
        }
      },
      error: (err) => {
        console.error('Failed to fetch plan:', err);
        this.router.navigate(['/subscription']);
      }
    });
  }

  get frequencyData() {
    return this.selectedPlan()?.subscriptions?.find((s: any) => s.frequency === this.selectedFrequency());
  }

  get amountDisplay() {
    return this.frequencyData?.price || 0;
  }

  proceedToPay() {
    if (this.isProcessing()) return;

    this.loadRazorpayScript().then(() => {
      this.initiatePurchase();
    }).catch(err => {
      console.error('Razorpay SDK failed to load:', err);
      this.toast.show('Could not load the payment system. Please check your connection.');
    });
  }

  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof Razorpay !== 'undefined') {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });
  }

  private initiatePurchase() {
    const subData = this.frequencyData;
    const plan = this.selectedPlan();
    if (!subData || !plan) {
      this.toast.show('Plan details not available.');
      return;
    }

    const amountInPaise = Math.round(subData.price * 100);
    this.isProcessing.set(true);

    const snapshot = {
      planName: plan.name,
      frequency: this.selectedFrequency(),
      price: subData.price,
      credits: subData.credits,
      currency: subData.currency || 'INR',
      features: [
        `${subData.credits} Credits/${this.selectedFrequency() === 'monthly' ? 'month' : (this.selectedFrequency() === 'yearly' ? 'year' : this.selectedFrequency())}`,
        ...(subData.features || [])
      ]
    };

    this.http.post<any>('http://localhost:3000/payment/create-order', {
      planId: plan.id,
      amount: subData.price, // Send base amount to save in DB
      credits: subData.credits,
      snapshot: snapshot
    }).subscribe({
      next: (orderData) => {
        this.openRazorpay(orderData, subData);
      },
      error: (err) => {
        console.error('Failed to create order:', err);
        this.isProcessing.set(false);
        this.toast.show('Could not initiate payment. Please try again.');
      }
    });
  }

  private openRazorpay(orderData: any, subData: any) {
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'News Aggregator',
      description: `Subscription: ${this.selectedPlan()?.name} (${subData.frequency})`,
      order_id: orderData.orderId,
      method: {
        upi: {
          qr: true
        }
      },
      handler: (response: any) => {
        this.verifyPayment(response);
      },
      prefill: {
        name: this.auth.currentUser()?.name || '',
        email: this.auth.currentUser()?.email || '',
        contact: this.auth.currentUser()?.phone || '9999999999'
      },
      theme: {
        color: '#000000'
      },
      modal: {
        ondismiss: () => {
          this.isProcessing.set(false);
          this.isAutoRedirecting.set(false);
          this.goBack();
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  private verifyPayment(razorpayResponse: any) {
    this.http.post<any>('http://localhost:3000/payment/verify', {
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature
    }).subscribe({
      next: (res) => {
        this.isProcessing.set(false);
        if (res.success) {
          this.transactionId.set(res.transactionId);
          this.successData.set(res); // All slip info: planName, amount, credits, expiryDate
          this.paymentSuccess.set(true);
          this.auth.refreshProfile().subscribe(); // Refresh credits in UI
          this.toast.show('Payment successfully completed!');
          // Remove automatic redirect to allow user to see the slip
          // setTimeout(() => {
          //   this.goBack();
          // }, 5000);
        } else {
          this.toast.show('Payment verification failed: ' + res.message);
        }
      },
      error: (err) => {
        console.error('Verification failed:', err);
        this.isProcessing.set(false);
        this.toast.show('Payment successful, but account update failed. Contact support.');
      }
    });
  }

  goToDashboard() {
    this.router.navigate(['/']); // Redirect to home (dashboard)
  }

  goBack() {
    const url = this.returnUrl();
    if (url) {
      this.router.navigateByUrl(url);
    } else {
      this.router.navigate(['/subscription']);
    }
  }
}
