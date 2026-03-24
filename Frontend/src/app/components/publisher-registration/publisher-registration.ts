import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FloatingInputComponent } from '../common/floating-input/floating-input';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-publisher-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FloatingInputComponent],
  templateUrl: './publisher-registration.html',
  styleUrl: './publisher-registration.css'
})
export class GuestPublisherRegistrationComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);

  email = '';
  username = '';
  name = '';
  phone = '';
  password = '';
  
  // Role is fixed for this page
  role = signal<'publisher'>('publisher');
  
  // Publisher shared fields
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

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  adminExists = signal(false);

  ngOnInit() {
    this.checkAdminExists();
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

  checkAdminExists() {
    this.http.get<{ exists: boolean }>('http://localhost:3000/auth/admin-exists').subscribe({
      next: (res) => this.adminExists.set(res.exists),
      error: () => this.adminExists.set(false)
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.http.post('http://localhost:3000/auth/register', {
      email: this.email,
      username: this.username,
      name: this.name,
      password: this.password,
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
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed');
      }
    });
  }
}
