import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FloatingInputComponent } from '../common/floating-input/floating-input';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, FloatingInputComponent],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <div class="form-side">
          <header class="form-header">
            <h1>Set New Password</h1>
            <p class="subtitle">Enter your new secure password. Make sure it's at least 6 characters long.</p>
          </header>

          @if (isSuccess()) {
            <div class="success-box">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span>Password updated! You can now log in.</span>
            </div>
            <button class="btn-premium" routerLink="/login">Go to Login</button>
          } @else {
            <form [formGroup]="resetForm" (submit)="onSubmit($event)" class="login-form">
              <div class="field-wrapper">
                <app-floating-input
                  label="New Password"
                  type="password"
                  id="password"
                  formControlName="password"
                  [isInvalid]="isFieldInvalid('password')"
                  [required]="true"
                >
                </app-floating-input>
                @if (isFieldInvalid('password')) {
                  <div class="field-error">
                    @if (resetForm.get('password')?.errors?.['required']) { <span>Password is required.</span> }
                    @if (resetForm.get('password')?.errors?.['minlength']) { <span>Minimum 6 characters.</span> }
                  </div>
                }
              </div>

              <div class="field-wrapper">
                <app-floating-input
                  label="Confirm New Password"
                  type="password"
                  id="confirmPassword"
                  formControlName="confirmPassword"
                  [isInvalid]="isFieldInvalid('confirmPassword')"
                  [required]="true"
                >
                </app-floating-input>
                @if (isFieldInvalid('confirmPassword')) {
                  <div class="field-error">
                    @if (resetForm.get('confirmPassword')?.errors?.['required']) { <span>Please confirm your password.</span> }
                    @if (resetForm.get('confirmPassword')?.hasError('mismatch')) { <span>Passwords do not match.</span> }
                  </div>
                }
              </div>

              <button type="submit" class="btn-premium" [disabled]="isLoading() || resetForm.invalid">
                <span>{{ isLoading() ? 'Updating Password...' : 'Save New Password' }}</span>
                @if (!isLoading()) {
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                }
              </button>
            </form>
          }
        </div>

        <div class="image-side">
          <div class="illustration-wrapper">
            <img src="https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" alt="Success Illustration" class="login-illustration">
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
      padding: 2rem;
      border-radius: 16px;
      border: 1px solid rgba(16, 185, 129, 0.2);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      margin-bottom: 2rem;
      font-weight: 700;
      line-height: 1.5;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  resetForm: FormGroup;
  isLoading = signal(false);
  isSuccess = signal(false);
  token: string | null = null;

  constructor() {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.toast.show('Invalid reset link. Request a new one.', 'error');
      this.router.navigate(['/forgot-password']);
    }
  }

  passwordMatchValidator(g: FormGroup) {
    const p = g.get('password')?.value;
    const cp = g.get('confirmPassword')?.value;
    return p === cp ? null : { mismatch: true };
  }

  isFieldInvalid(field: string): boolean {
    const control = this.resetForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.resetForm.invalid || !this.token) return;

    this.isLoading.set(true);
    const { password } = this.resetForm.value;

    this.authService.resetPassword(this.token, password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.isSuccess.set(true);
        this.toast.show('Password reset successfully!', 'success');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.show(err.error?.message || 'Failed to reset password.', 'error');
      }
    });
  }
}
