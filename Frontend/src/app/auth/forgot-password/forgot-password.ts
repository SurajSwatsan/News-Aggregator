import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth';
import { Router, RouterLink } from '@angular/router';
import { FloatingInputComponent } from '../../components/common/floating-input/floating-input';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, FloatingInputComponent],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="form-side">
          <a routerLink="/login" class="back-home">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Login
          </a>
          
          <header class="form-header">
            <h1>Reset Password</h1>
            <p class="subtitle">Enter your email address and we'll send you a link to restore access to your account.</p>
          </header>

          @if (successMessage()) {
            <div class="success-box">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>{{ successMessage() }}</span>
            </div>
            <button class="btn-premium secondary" routerLink="/login">Return to Login</button>
          } @else {
            <form [formGroup]="forgotForm" (submit)="onSubmit($event)" class="login-form">
              <div class="field-wrapper">
                <app-floating-input
                  label="E-mail Address"
                  type="email"
                  id="email"
                  formControlName="email"
                  [isInvalid]="isFieldInvalid('email')"
                  [required]="true"
                >
                </app-floating-input>
                @if (isFieldInvalid('email')) {
                  <div class="field-error">
                    @if (forgotForm.get('email')?.errors?.['required']) { <span>Email is required.</span> }
                    @if (forgotForm.get('email')?.errors?.['email']) { <span>Invalid email format.</span> }
                  </div>
                }
              </div>

              <button type="submit" class="btn-premium" [disabled]="isLoading() || forgotForm.invalid">
                <span>{{ isLoading() ? 'Sending Link...' : 'Send Reset Link' }}</span>
                @if (!isLoading()) {
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                }
              </button>
            </form>
          }
        </div>

        <div class="image-side">
          <div class="illustration-wrapper">
            <img src="https://images.unsplash.com/photo-1633265486064-086b219458ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="Security Illustration" class="login-illustration">
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: '../login/login.css',
  styles: [`
    .success-box {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      padding: 1.5rem;
      border-radius: 12px;
      border: 1px solid rgba(16, 185, 129, 0.2);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      font-weight: 600;
      line-height: 1.5;
    }
    .btn-premium.secondary {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border);
      box-shadow: none;
    }
    .btn-premium.secondary:hover {
      background: rgba(255,255,255,0.1);
    }
  `]
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  forgotForm: FormGroup;
  isLoading = signal(false);
  successMessage = signal<string | null>(null);

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.forgotForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.forgotForm.invalid) return;

    this.isLoading.set(true);
    const { email } = this.forgotForm.value;

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.successMessage.set(res.message);
        this.toast.show('Reset link sent to your email.', 'success');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.show(err.error?.message || 'Failed to request password reset.', 'error');
      }
    });
  }
}
