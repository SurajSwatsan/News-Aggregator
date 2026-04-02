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
   isUploading = signal<string | null>(null);

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.authService.refreshProfile().subscribe(user => {
      this.user.set({ ...user });
    });
  }

  onFileSelected(event: any, field: string) {
    const file = event.target.files[0];
    if (file) {
      this.uploadFile(file, field);
    }
  }

  uploadFile(file: File, field: string) {
    const formData = new FormData();
    formData.append('file', file);

    this.isUploading.set(field);
    this.http.post('http://localhost:3000/publisher/upload-doc', formData).subscribe({
      next: (res: any) => {
        this.user.update(u => ({ ...u, [field]: res.filename }));
        this.isUploading.set(null);
        this.toast.show('File uploaded successfully!', 'success');
      },
      error: (err) => {
        this.isUploading.set(null);
        this.toast.show('Failed to upload file. Please try again.', 'error');
        console.error('Upload failed:', err);
      }
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
