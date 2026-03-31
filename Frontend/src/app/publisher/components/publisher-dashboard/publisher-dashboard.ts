import { Component, signal, computed, inject, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../auth/auth';
import { Router, ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProfileDropdownComponent } from '../../../components/profile-dropdown/profile-dropdown';

@Component({
  selector: 'app-publisher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, ProfileDropdownComponent],
  templateUrl: './publisher-dashboard.html',
  styleUrl: './publisher-dashboard.css'
})
export class PublisherDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private elementRef = inject(ElementRef);

  isProfileMenuOpen = signal(false);
  activeTab = signal<'dashboard' | 'articles' | 'analytics' | 'revenue' | 'payouts' | 'settings' | 'ads' | 'profile'>('dashboard');
  user = computed(() => this.authService.currentUser());

  sourceDetails = signal<any>(null);
  
  ngOnInit() {
    this.updateActiveTab();
    this.router.events.subscribe(() => {
      this.updateActiveTab();
    });
    this.loadData();
  }

  private updateActiveTab() {
    const url = this.router.url;
    if (url.includes('/articles')) this.activeTab.set('articles');
    else if (url.includes('/analytics')) this.activeTab.set('analytics');
    else if (url.includes('/revenue')) this.activeTab.set('revenue');
    else if (url.includes('/payouts')) this.activeTab.set('payouts');
    else if (url.includes('/ads')) this.activeTab.set('ads');
    else if (url.includes('/settings') || url.includes('/profile')) this.activeTab.set('profile');
    else if (url.includes('/dashboard')) this.activeTab.set('dashboard');
    else this.activeTab.set('dashboard');
  }

  loadData() {
    const baseUrl = 'http://localhost:3000/publisher';
    this.http.get(`${baseUrl}/source`).subscribe((res: any) => {
      this.sourceDetails.set(res);
    });
  }

  logout() {
    this.authService.logout();
  }


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

  getAvatarInitials(name?: string): string {
    if (!name) return 'U';
    // If it's an email, try to get initials from the name part
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
