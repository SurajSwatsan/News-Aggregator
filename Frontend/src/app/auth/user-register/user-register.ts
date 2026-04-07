import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../auth';
import { Router, RouterLink } from '@angular/router';
import { FloatingInputComponent } from '../../components/common/floating-input/floating-input';
import { ToastService } from '../../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { MasterService } from '../../services/master.service';
import { FloatingSelectComponent } from '../../components/common/floating-select/floating-select';

export function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

export function alphabetValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value && !/^[a-zA-Z\s]*$/.test(value)) {
    return { alphabetOnly: true };
  }
  return null;
}

export function passwordComplexityValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumeric = /[0-9]/.test(value);
  const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;
  if (!passwordValid) {
    return { passwordComplexity: true };
  }
  return null;
}

@Component({
  selector: 'app-user-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, FloatingInputComponent, FloatingSelectComponent],
  templateUrl: './user-register.html',
  styleUrl: './user-register.css'
})
export class UserRegisterComponent implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);
  private masterService = inject(MasterService);

  // Toggle between modes
  registrationType = signal<'user' | 'publisher'>('user');

  registerForm: FormGroup;
  private fb = inject(FormBuilder);

  // Common fields
  email = '';
  otp = '';

  // Publisher specific fields
  businessFileName = signal<string | null>(null);
  licenseFileName = signal<string | null>(null);

  // UI State
  step = signal<1 | 2>(1); // 1: Bio/Form, 2: OTP (only for users)
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  adminExists = signal(false);

  // Master Data
  countries = signal<any[]>([]);
  states = signal<any[]>([]);
  cities = signal<any[]>([]);

  constructor() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      firstName: ['', [Validators.required, Validators.minLength(2), alphabetValidator]],
      lastName: ['', [Validators.required, Validators.minLength(2), alphabetValidator]],
      password: ['', [Validators.required, Validators.minLength(6), passwordComplexityValidator]],
      confirmPassword: ['', [Validators.required]],
      // Publisher fields
      orgName: [''],
      orgWebsite: [''],
      rssUrl: [''],
      country: [''],
      city: [''],
      state: [''],
      phone: [''],
      newspaperLicense: ['']
    }, { validators: passwordMatchValidator });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  ngOnInit() {
    this.checkAdminExists();
    this.loadCountries();
    this.loadStates();
    this.loadCities(); // Load all cities initially
    
    // Default to publisher if arriving via /register-publisher
    if (this.router.url.includes('register-publisher')) {
      this.onTypeChange('publisher');
    }
  }

  loadCountries() {
    this.masterService.getCountries().subscribe(data => {
      this.countries.set(data.map(c => ({ value: c.name, label: c.name, id: c.id })));
    });
  }

  loadCities(countryId?: string, stateId?: string) {
    this.masterService.getCities(countryId, stateId).subscribe(data => {
      this.cities.set(data.map(city => ({ 
        value: city.name, 
        label: (countryId || stateId) ? city.name : `${city.name} (${city.country?.name || 'Unknown'})`,
        id: city.id
      })));
    });
  }

  onCountryChange(countryName: string) {
    this.registerForm.patchValue({ state: '', city: '' });
    if (!countryName) {
      this.states.set([]);
      this.cities.set([]);
      return;
    }
    const country = this.countries().find(c => c.value === countryName);
    if (country) {
      this.loadStates(country.id);
      this.loadCities(country.id);
    }
  }

  onStateChange(stateName: string) {
    this.registerForm.patchValue({ city: '' });
    if (!stateName) {
      const countryName = this.registerForm.get('country')?.value;
      this.onCountryChange(countryName);
      return;
    }
    const state = this.states().find(s => s.value === stateName);
    if (state) {
      // Find state by name in our list. Note: states() values are names.
      // We need the ID. Let's update loadStates to include ID.
      const stateObj = this.rawStates.find(s => s.name === stateName);
      if (stateObj) {
        this.loadCities(undefined, stateObj.id);
      }
    }
  }

  rawStates: any[] = [];
  loadStates(countryId?: string) {
    this.masterService.getStates(countryId).subscribe(data => {
      this.rawStates = data;
      this.states.set(data.map(s => ({ 
        value: s.name, 
        label: countryId ? s.name : `${s.name} (${s.country?.name || 'Unknown'})`,
        id: s.id
      })));
    });
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
    
    // Dynamically update validators based on role
    const isPublisher = type === 'publisher';
    
    if (isPublisher) {
      this.registerForm.get('password')?.clearValidators();
      this.registerForm.get('confirmPassword')?.clearValidators();
      
      this.registerForm.get('orgName')?.setValidators([Validators.required]);
      this.registerForm.get('orgWebsite')?.setValidators([Validators.required]);
      this.registerForm.get('country')?.setValidators([Validators.required]);
      this.registerForm.get('state')?.setValidators([Validators.required]);
      this.registerForm.get('city')?.setValidators([Validators.required]);
      this.registerForm.get('phone')?.setValidators([Validators.required]);
      this.registerForm.get('newspaperLicense')?.setValidators([Validators.required]);
    } else {
      this.registerForm.get('password')?.setValidators([Validators.required, Validators.minLength(6), passwordComplexityValidator]);
      this.registerForm.get('confirmPassword')?.setValidators([Validators.required]);
      
      this.registerForm.get('orgName')?.clearValidators();
      this.registerForm.get('orgWebsite')?.clearValidators();
      this.registerForm.get('country')?.setValidators([Validators.required]);
      this.registerForm.get('state')?.setValidators([Validators.required]);
      this.registerForm.get('city')?.setValidators([Validators.required]);
      this.registerForm.get('phone')?.setValidators([Validators.required, Validators.pattern('^[0-9+]*$')]);
      this.registerForm.get('newspaperLicense')?.clearValidators();
    }
    
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.updateValueAndValidity();
    });
  }

  onFileSelected(event: any, field: 'business' | 'license') {
    const file = event.target.files[0];
    if (file) {
      if (field === 'business') {
        this.businessFileName.set(file.name);
      } else {
        this.licenseFileName.set(file.name);
        this.registerForm.patchValue({ newspaperLicense: file.name });
      }
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    
    this.errorMessage.set(null);

    if (this.registrationType() === 'user') {
      this.handleUserSubmit();
    } else {
      this.handlePublisherSubmit();
    }
  }

  private handleUserSubmit() {
    this.isLoading.set(true);

    const { email, firstName, lastName, password, phone, city, state, country } = this.registerForm.value;
    this.email = email; // Set property for OTP step display

    this.authService.requestOtp(email, firstName, lastName, password, phone, city, state, country).subscribe({
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
    const val = this.registerForm.value;

    this.http.post('http://localhost:3000/auth/register', {
      email: val.email,
      username: val.lastName,
      name: val.firstName,
      requestedRole: 'publisher',
      isPublisher: true,
      orgName: val.orgName,
      orgWebsite: val.orgWebsite,
      rssUrl: val.rssUrl,
      country: val.country,
      state: val.state,
      city: val.city,
      phone: val.phone,
      businessDoc: this.businessFileName(),
      newspaperLicense: val.newspaperLicense,
      firstName: val.firstName,
      lastName: val.lastName
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
