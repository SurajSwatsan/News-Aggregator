import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth';

@Component({
  selector: 'app-confirm-approval',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="activation-wrapper">
      <div class="activation-card">
        @if (status() === 'loading') {
          <div class="status-content">
            <div class="loader"></div>
            <h2>Confirming your approval...</h2>
            <p>Please wait while we process your request.</p>
          </div>
        } @else if (status() === 'success') {
          <div class="status-content success">
            <svg xmlns="http://www.w3.org/2000/svg" class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <h2>Approval Confirmed!</h2>
            <p>Your application is now fully verified.</p>
            <div class="message-box">
              <p>We've sent a <strong>second email</strong> to your registered address with a link to set your password.</p>
            </div>
            <p class="hint">Check your inbox (and spam folder) for the password setup link. Then log in to access your publisher dashboard.</p>
            <button (click)="goHome()" class="btn-primary">Continue</button>
          </div>
        } @else if (status() === 'already-registered') {
          <div class="status-content already">
            <svg xmlns="http://www.w3.org/2000/svg" class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
            <h2>Already Registered</h2>
            <p>This email is already linked to an existing account.</p>
            <div class="message-box info-box">
              <p>You can log in directly using your existing credentials.</p>
            </div>
            <a routerLink="/login" class="btn-primary">Go to Login</a>
          </div>
        } @else {
          <div class="status-content error">
            <svg xmlns="http://www.w3.org/2000/svg" class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
            <h2>Invalid or Expired Link</h2>
            <p>{{ errorMessage() || 'This approval link is no longer valid or has already been used.' }}</p>
            <a routerLink="/" class="btn-secondary">Back to Home</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .activation-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 2rem;
      font-family: 'Inter', sans-serif;
    }
    .activation-card {
      background: white;
      padding: 3rem;
      border-radius: 20px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.05);
      max-width: 500px;
      width: 100%;
      text-align: center;
    }
    .status-content h2 { margin: 1.5rem 0 0.5rem; color: #1e293b; font-weight: 800; }
    .status-content p { color: #64748b; line-height: 1.6; }
    .status-icon { width: 64px; height: 64px; margin: 0 auto; }
    .success .status-icon { color: #10b981; }
    .error .status-icon { color: #ef4444; }
    .message-box {
      background: #f0fdf4;
      border: 1px solid #bcf0da;
      padding: 1rem;
      border-radius: 12px;
      margin: 1.5rem 0;
    }
    .message-box p { color: #065f46; margin: 0; }
    .btn-primary, .btn-secondary {
      display: inline-block;
      margin-top: 2rem;
      padding: 0.75rem 2rem;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 700;
      transition: all 0.2s;
    }
    .btn-primary { background: #6366f1; color: white; }
    .btn-secondary { background: #e2e8f0; color: #475569; }
    .already .status-icon { color: #3b82f6; }
    .info-box { background: #eff6ff; border-color: #bfdbfe; }
    .info-box p { color: #1e40af; }
    .loader {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #6366f1;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  `]
})
export class ConfirmApprovalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);
  private auth = inject(AuthService);

  status = signal<'loading' | 'success' | 'error' | 'already-registered'>('loading');
  errorMessage = signal<string | null>(null);

  goHome() {
    const user = this.auth.currentUser();
    if (user?.role === 'admin') {
      this.router.navigate(['/admin']);
    } else if (user?.role === 'publisher') {
      this.router.navigate(['/publisher']);
    } else {
      // Publisher who just confirmed — next step is to set password then login
      this.router.navigate(['/login']);
    }
  }

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status.set('error');
      return;
    }

    this.http.get(`http://localhost:3000/onboarding/confirm-approval?token=${token}`).subscribe({
      next: () => this.status.set('success'),
      error: (err) => {
        const msg: string = err.error?.message || '';
        if (msg.toLowerCase().includes('already registered')) {
          this.status.set('already-registered');
        } else {
          this.status.set('error');
          this.errorMessage.set(msg);
        }
      }
    });
  }
}
