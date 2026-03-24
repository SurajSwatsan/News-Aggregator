import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth';
import { Router, RouterLink } from '@angular/router';
import { FloatingInputComponent } from '../common/floating-input/floating-input';
import { ToastService } from '../../services/toast.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-user-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FloatingInputComponent],
  templateUrl: './user-registration.html',
  styleUrl: './user-registration.css'
})
export class UserRegistrationComponent implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);

  // Toggle between modes
  registrationType = signal<'user' | 'publisher'>('user');

  // Common fields
  email = '';
  username = '';
  name = '';
  otp = '';

  // Publisher specific fields
  phone = '';
  password = '';
  confirmPassword = '';
  publisherFirstName = '';
  publisherLastName = '';
  orgName = '';
  orgWebsite = '';
  rssUrl = '';
  orgDescription = '';
  country = '';
  city = '';
  businessDoc = '';
  newspaperLicense = '';
  businessFileName = signal<string | null>(null);
  licenseFileName = signal<string | null>(null);

  // UI State
  step = signal<1 | 2>(1); // 1: Bio/Form, 2: OTP (only for users)
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  adminExists = signal(false);

  ngOnInit() {
    this.checkAdminExists();
    // Default to publisher if arriving via /register-publisher
    if (this.router.url.includes('register-publisher')) {
      this.registrationType.set('publisher');
    }
  }

  checkAdminExists() {
    this.http.get<{ exists: boolean }>('http://localhost:3000/auth/admin-exists').subscribe({
      next: (res) => this.adminExists.set(res.exists),
      error: () => this.adminExists.set(false)
    });
  }

  onTypeChange(type: 'user' | 'publisher') {
    this.registrationType.set(type);
    this.errorMessage.set(null);
    this.step.set(1);
  }

  onFileSelected(event: any, field: 'business' | 'license') {
    const file = event.target.files[0];
    if (file) {
      if (field === 'business') {
        this.businessFileName.set(file.name);
        this.businessDoc = file.name;
      } else {
        this.licenseFileName.set(file.name);
        this.newspaperLicense = file.name;
      }
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set(null);

    if (this.registrationType() === 'user') {
      this.handleUserSubmit();
    } else {
      this.handlePublisherSubmit();
    }
  }

  private handleUserSubmit() {
    if (!this.email || !this.name || !this.password) return;
    
    if (this.password !== this.confirmPassword) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    this.isLoading.set(true);

    this.authService.requestOtp(this.email, this.name, this.username, this.password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.step.set(2);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to send OTP. Please check your email.');
      }
    });
  }

  private handlePublisherSubmit() {
    this.isLoading.set(true);
    this.http.post('http://localhost:3000/auth/register', {
      email: this.email,
      username: this.username,
      name: this.name,
      requestedRole: 'publisher',
      isPublisher: true,
      orgName: this.orgName,
      orgWebsite: this.orgWebsite,
      rssUrl: this.rssUrl,
      orgDescription: this.orgDescription,
      publisherFirstName: this.publisherFirstName,
      publisherLastName: this.publisherLastName,
      country: this.country,
      city: this.city,
      phone: this.phone,
      businessDoc: this.businessDoc,
      newspaperLicense: this.newspaperLicense
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.show('Publisher registration submitted! Please wait for admin approval.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(true); // Keep loading state if error? No.
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed');
      }
    });
  }

  onVerifyOtp(event: Event) {
    event.preventDefault();
    if (!this.otp) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyOtp(this.email, this.otp).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.toast.show('Registration successful! Please login with your email and password.');
        this.router.navigate(['/login']);
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
