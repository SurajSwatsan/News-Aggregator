import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { MasterService } from '../../../services/master.service';
import { FloatingSelectComponent } from '../../../components/common/floating-select/floating-select';

@Component({
  selector: 'app-publisher-registration',
  standalone: true,
  imports: [CommonModule, FormsModule, FloatingSelectComponent],
  templateUrl: './publisher-registration.html',
  styleUrl: './publisher-registration.css'
})
export class PublisherRegistrationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);
  private masterService = inject(MasterService);

  token = signal<string | null>(null);
  invitation = signal<any>(null);
  isLoading = signal(true);
  isSubmitting = signal(false);
  success = signal(false);

  // Master Data
  countries = signal<any[]>([]);
  cities = signal<any[]>([]);

  orgName = '';
  orgWebsite = '';
  rssUrl = '';
  orgDescription = '';
  firstName = '';
  lastName = '';
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
        this.loadCountries();
        this.loadCities(); // Load all cities initially
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadCountries() {
    this.masterService.getCountries().subscribe(data => {
      this.countries.set(data.map(c => ({ value: c.name, label: c.name, id: c.id })));
    });
  }

  loadCities(countryId?: string) {
    this.masterService.getCities(countryId).subscribe(data => {
      this.cities.set(data.map(city => ({ 
        value: city.name, 
        label: countryId ? city.name : `${city.name} (${city.country?.name || 'Unknown'})`
      })));
    });
  }

  onCountryChange(countryName: string) {
    if (!countryName) {
      this.loadCities();
      return;
    }
    const country = this.countries().find(c => c.value === countryName);
    if (country) {
      this.loadCities(country.id);
    } else {
      this.loadCities();
    }
  }

  onSubmit() {
    this.isSubmitting.set(true);
    const data = {
      token: this.token(),
      orgName: this.orgName,
      orgWebsite: this.orgWebsite,
      rssUrl: this.rssUrl,
      orgDescription: this.orgDescription,
      publisherFirstName: this.firstName,
      publisherLastName: this.lastName,
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
        this.toast.show('Failed to register. Please try again.', 'error');
      }
    });
  }
}
