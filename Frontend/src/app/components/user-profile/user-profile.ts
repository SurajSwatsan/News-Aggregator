import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth';
import { Router } from '@angular/router';
import { FooterComponent } from '../common/footer/footer';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FooterComponent],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.scss']
})
export class UserProfileComponent implements OnInit {
  public auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.currentUser;

  ngOnInit() {
    this.auth.refreshProfile().subscribe();
  }

  editProfile() {
    this.router.navigate(['/edit-profile']);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
