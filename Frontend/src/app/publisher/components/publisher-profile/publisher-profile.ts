import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../services/toast.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-publisher-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './publisher-profile.html',
  styleUrl: './publisher-profile.scss'
})
export class PublisherProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  user = signal<any>(null);
  isLoading = signal(true);

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.isLoading.set(true);
    this.authService.refreshProfile().subscribe({
      next: (user) => {
        this.user.set({ ...user });
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  // Edit logic moved to PublisherProfileEditComponent
}
