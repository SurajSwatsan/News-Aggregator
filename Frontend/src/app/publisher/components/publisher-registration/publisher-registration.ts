import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-publisher-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './publisher-registration.html',
  styleUrl: './publisher-registration.css'
})
export class PublisherRegistrationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  token = signal<string | null>(null);
  invitation = signal<any>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  success = signal(false);

  orgName = '';
  orgWebsite = '';
  rssUrl = '';
  orgDescription = '';
  publisherName = '';
  country = '';
  city = '';
  phone = '';
  
  // Doc placeholders
  businessDocName = signal<string | null>(null);
  licenseDocName = signal<string | null>(null);

  ngOnInit() {
    this.token.set(this.route.snapshot.queryParamMap.get('token'));
    if (!this.token()) {
      this.isLoading.set(false);
      return;
    }
    this.verifyToken();
  }

  verifyToken() {
    this.http.get(`http://localhost:3000/onboarding/verify?token=${this.token()}`).subscribe({
      next: (res) => {
        this.invitation.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onSubmit() {
    this.isSubmitting.set(true);
    const data = {
      token: this.token(),
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
    };

    this.http.post('http://localhost:3000/onboarding/register', data).subscribe({
      next: () => {
        this.success.set(true);
        this.isSubmitting.set(false);
      },
      error: () => {
        this.isSubmitting.set(false);
        alert('Failed to register. Please try again.');
      }
    });
  }
}
