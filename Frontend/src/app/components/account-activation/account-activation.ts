import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-account-activation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-activation.html',
  styleUrl: './account-activation.css'
})
export class AccountActivationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private router = inject(Router);

  token = signal<string | null>(null);
  password = '';
  confirmPassword = '';
  isSubmitting = signal(false);
  success = signal(false);

  ngOnInit() {
    this.token.set(this.route.snapshot.queryParamMap.get('token'));
  }

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    this.isSubmitting.set(true);
    this.http.post('http://localhost:3000/onboarding/activate', {
      token: this.token(),
      password: this.password
    }).subscribe({
      next: () => {
        this.success.set(true);
        this.isSubmitting.set(false);
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: () => {
        this.isSubmitting.set(false);
        alert('Failed to activate account. The link might be expired.');
      }
    });
  }
}
