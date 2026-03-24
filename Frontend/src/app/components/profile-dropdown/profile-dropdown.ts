import { Component, signal, computed, inject, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile-dropdown.html',
  styleUrl: './profile-dropdown.css'
})
export class ProfileDropdownComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  isProfileMenuOpen = signal(false);
  user = computed(() => this.authService.currentUser());

  toggleProfileMenu(event: Event) {
    event.stopPropagation();
    this.isProfileMenuOpen.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!this.elementRef.nativeElement.contains(target)) {
      this.isProfileMenuOpen.set(false);
    }
  }

  logout() {
    this.authService.logout();
  }


  getAvatarInitials(name?: string): string {
    if (!name) return 'U';
    if (name.includes('@')) {
      name = name.split('@')[0].replace('.', ' ');
    }
    const parts = name.split(/[ ._]/).filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  }
}
