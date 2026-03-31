import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth/auth';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../services/toast.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-publisher-profile-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './publisher-profile-edit.html',
  styleUrl: './publisher-profile-edit.scss'
})
export class PublisherProfileEditComponent implements OnInit {
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private router = inject(Router);

  user = signal<any>(null);
  isSaving = signal(false);

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.authService.refreshProfile().subscribe(user => {
      this.user.set({ ...user });
    });
  }

  saveProfile() {
    const userData = this.user();
    if (!userData) return;

    this.isSaving.set(true);
    this.http.patch(`http://localhost:3000/auth/users/${userData.id}`, userData).subscribe({
      next: (res: any) => {
        this.isSaving.set(false);
        this.toast.show('Profile updated successfully!', 'success');
        this.authService.updateCurrentUser(res);
        this.router.navigate(['/publisher/profile']);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.show('Failed to update profile. Please try again.', 'error');
        console.error('Profile update failed:', err);
      }
    });
  }
}
