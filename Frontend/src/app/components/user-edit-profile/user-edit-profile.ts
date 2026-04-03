import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth';

@Component({
  selector: 'app-user-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-edit-profile.html',
  styleUrls: ['./user-edit-profile.scss']
})
export class UserEditProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.currentUser;
  editData = { firstName: '', lastName: '' };
  isLoading = false;

  ngOnInit() {
    const u = this.user();
    if (u) {
      this.editData = { firstName: u.firstName || '', lastName: u.lastName || '' };
    } else {
      this.router.navigate(['/']);
    }
  }

  saveProfile() {
    const u = this.user();
    if (!u) return;

    this.isLoading = true;
    this.auth.updateProfile(u.id, this.editData).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        this.isLoading = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/profile']);
  }
}
