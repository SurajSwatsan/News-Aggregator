import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reader-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reader-registration.html',
  styleUrl: './reader-registration.css'
})
export class ReaderRegistrationComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  email = '';
  username = '';
  name = '';
  phone = '';
  
  // Role selection
  role = signal<'reader' | 'publisher' | 'admin'>('reader');
  
  toggleUserRole(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.role.set(isChecked ? 'publisher' : 'reader');
  }
  
  // Publisher/Admin shared fields
  publisherName = '';
  orgName = '';
  orgWebsite = '';
  rssUrl = '';
  orgDescription = '';
  country = '';
  city = '';
  businessDocName = signal<string | null>(null);
  licenseDocName = signal<string | null>(null);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  adminExists = signal(false);

  ngOnInit() {
    this.checkAdminExists();
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
      password: '', // Password removed from UI
      requestedRole: this.role(),
      isPublisher: this.role() === 'publisher',
      orgName: this.orgName,
      orgWebsite: this.orgWebsite,
      rssUrl: this.rssUrl,
      orgDescription: this.orgDescription,
      publisherName: this.publisherName,
      country: this.country,
      city: this.city,
      phone: this.phone,
      businessDoc: this.businessDocName(),
      newspaperLicense: this.licenseDocName()
    }).subscribe({
      next: () => {
        this.isLoading.set(false);
        alert('Registration successful! Please log in.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed');
      }
    });
  }
}
