import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../auth/auth';
import { Router, RouterLink } from '@angular/router';
import { FloatingInputComponent } from '../common/floating-input/floating-input';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, FloatingInputComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  // Removed duplicate inject() calls to resolve TS2300 error

  loginForm: FormGroup;
  email = ''; // Kept purely for the OTP state summary bindings
  otp = '';

  step = signal<1 | 2>(1); // 1: Email, 2: OTP
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(private authService: AuthService, private router: Router, private fb: FormBuilder) { 
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  onLogin(event: Event) {
    event.preventDefault();
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;
    this.email = email; // Store for step 2

    // Using the /auth/login endpoint
    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        if (res.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (res.user.role === 'publisher') {
          this.router.navigate(['/publisher']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid email or password.');
      }
    });
  }

  // Alias for template compatibility (prevents ctx_r0.onRequestOtp error)
  onRequestOtp(event: Event) {
    this.onLogin(event);
  }

  onVerifyOtp(event: Event) {
    event.preventDefault();
    if (!this.otp) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyOtp(this.email, this.otp).subscribe({
      next: (res) => {
        if (res.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (res.user.role === 'publisher') {
          this.router.navigate(['/publisher']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid or expired OTP.');
      }
    });
  }

  resetStep() {
    this.step.set(1);
    this.otp = '';
    this.errorMessage.set(null);
  }
}
