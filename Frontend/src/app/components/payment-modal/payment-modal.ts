import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessService } from '../../services/access.service';
import { AuthService } from '../../auth/auth';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Top Up Your Credits</h3>
          <button class="close-btn" (click)="close.emit()">&times;</button>
        </div>
        <div class="balance-warning">
          <p>You have 0 credits remaining. Please choose a plan to continue reading premium stories.</p>
        </div>
        <div class="plans-grid">
          <div class="plan-card">
            <span class="plan-tag">BASIC</span>
            <h4>10 CREDITS</h4>
            <p class="price">$4.99</p>
            <button class="btn-buy" (click)="buy(10)">Buy Now</button>
          </div>
          <div class="plan-card featured">
            <span class="plan-tag">POPULAR</span>
            <h4>25 CREDITS</h4>
            <p class="price">$9.99</p>
            <button class="btn-buy" (click)="buy(25)">Buy Now</button>
          </div>
          <div class="plan-card">
            <span class="plan-tag">PRO</span>
            <h4>100 CREDITS</h4>
            <p class="price">$19.99</p>
            <button class="btn-buy" (click)="buy(100)">Buy Now</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2000;
      backdrop-filter: blur(8px);
    }
    .modal-content {
      background: #0a0a0b;
      border: 1px solid #333;
      padding: 3rem;
      border-radius: 4px;
      max-width: 800px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .modal-header h3 {
      font-family: 'Lora', serif;
      font-size: 2rem;
      color: white;
      margin: 0;
    }
    .close-btn {
      background: transparent;
      border: none;
      color: #666;
      font-size: 2rem;
      cursor: pointer;
    }
    .balance-warning {
      background: #111;
      padding: 1rem;
      border-left: 4px solid #dc2626;
      margin-bottom: 2.5rem;
      color: #999;
    }
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }
    .plan-card {
      background: #111;
      border: 1px solid #222;
      padding: 2.5rem;
      text-align: center;
      transition: all 0.3s;
    }
    .plan-card:hover {
      border-color: #444;
      transform: translateY(-5px);
    }
    .plan-card.featured {
      border-color: #dc2626;
      background: #110808;
    }
    .plan-tag {
      font-size: 0.6rem;
      font-weight: 900;
      letter-spacing: 2px;
      color: #777;
    }
    .plan-card.featured .plan-tag { color: #dc2626; }
    h4 { font-size: 1.5rem; margin: 1rem 0; color: white; }
    .price { font-size: 2.5rem; font-weight: 900; color: white; margin-bottom: 2rem; }
    .btn-buy {
      width: 100%;
      background: transparent;
      border: 1px solid #444;
      color: white;
      padding: 0.75rem;
      font-weight: 900;
      cursor: pointer;
      transition: all 0.3s;
    }
    .plan-card.featured .btn-buy, .btn-buy:hover {
      background: #dc2626;
      border-color: #dc2626;
    }
  `]
})
export class PaymentModalComponent {
  private accessService = inject(AccessService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  @Output() close = new EventEmitter<void>();

  buy(credits: number) {
    this.accessService.addCredits(credits).subscribe({
      next: () => {
        this.toast.show(`Successfully added ${credits} credits!`);
        this.close.emit();
      },
      error: (err: any) => {
        console.error('Failed to add credits:', err);
        // Fallback for immediate success in UI (Static/Demo mode as requested)
        this.toast.show(`Thank you! ${credits} credits have been added to your account.`);
        const user: any = this.auth.currentUser();
        if (user) {
          // Update local state so user can immediately unlock articles
          const updatedUser = { 
            ...user, 
            id: user.id || 'current-user-id',
            creditBalance: (parseFloat(user.creditBalance) || 0) + credits 
          };
          this.auth.currentUser.set(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        this.close.emit();
      }
    });
  }
}
