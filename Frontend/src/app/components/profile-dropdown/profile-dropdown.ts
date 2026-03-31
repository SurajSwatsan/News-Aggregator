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


  getAvatarInitials(user: any): string {
    if (!user) return 'UN';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';

    if (firstName && lastName) {
      // User requested: First name 1st letter + Last name 1st letter
      const firstChar = firstName.trim().charAt(0);
      const lastChar = lastName.trim().charAt(0);
      return (firstChar + lastChar).toUpperCase();
    }

    let name = user.name || user.email || 'User';
    
    if (name.includes('@')) {
      name = name.split('@')[0].replace(/[^a-zA-Z]/g, ' ');
    }
    
    const parts = name.trim().split(/\s+/).filter((p: string) => p.length > 0);
    if (parts.length >= 2) {
      const firstPart = parts[0];
      const lastPart = parts[parts.length - 1];
      return (firstPart[0] + lastPart[lastPart.length - 1]).toUpperCase();
    }
    
    if (name.length > 1) {
       return (name[0] + name[name.length - 1]).toUpperCase();
    }
    
    return name[0].toUpperCase() || 'U';
  }
}
