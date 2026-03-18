import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth';
import { Router, RouterLink, ActivatedRoute, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  user = computed(() => this.authService.currentUser());
  activeTab = signal('overview');

  headerTitle = computed(() => {
    console.log('[AdminHub] Computing header title for tab:', this.activeTab());
    switch (this.activeTab()) {
      case 'overview': return 'Admin System Overview';
      case 'sources': return 'News Sources Management';
      case 'readers': return 'Reader Analytics & Management';
      case 'publishers': return 'Publisher Hub';
      case 'users': return 'Platform User Management';
      default: return 'Unknown Admin Section';
    }
  });

  // Dashboard Stats
  totalArticles = signal(1284);
  activeSources = signal(3);
  totalReaders = signal(0);
  revenueShare = signal(4200);
  sourcesAddedToday = signal(0);
  sources = signal<any[]>([]);

  // User Management Logic
  usersSubTab = signal('all');
  allUsers = signal<any[]>([]);
  editingUser = signal<any | null>(null);
  pendingRequests = signal<any[]>([]);
  inviteEmail = signal('');
  lastInviteLink = signal<string | null>(null);

  filteredUsers = computed(() => {
    const tab = this.usersSubTab();
    const users = this.allUsers();
    
    switch (tab) {
      case 'publishers':
        return users.filter(u => u.role === 'publisher' && !u.isDeleted);
      case 'readers':
        return users.filter(u => u.role === 'reader' && !u.isDeleted);
      case 'deleted':
        return users.filter(u => u.isDeleted);
      default:
        return users.filter(u => !u.isDeleted);
    }
  });

  // Data helpers
  publishers = computed(() => {
    return this.allUsers().filter(u => u.role === 'publisher' && !u.isDeleted);
  });

  readers = computed(() => {
    return this.allUsers().filter(u => u.role === 'reader' && !u.isDeleted);
  });

  ngOnInit() {
    this.route.url.subscribe(url => {
      const path = url[0]?.path;
      if (path === 'sources') {
        this.activeTab.set('sources');
      } else if (path === 'readers') {
        this.activeTab.set('users');
        this.usersSubTab.set('readers');
      } else if (path === 'user') {
        this.activeTab.set('users');
        this.usersSubTab.set('all');
      } else {
        this.activeTab.set('overview');
      }
    });
    this.loadAllData();
  }

  loadAllData() {
    this.loadStats();
    this.loadSources();
    this.loadUsers();
    this.loadPendingRequests();
  }

  loadStats() {
    this.http.get<any>('http://localhost:3000/admin/stats').subscribe(res => {
      this.totalArticles.set(res.totalArticles);
      this.activeSources.set(res.totalSources);
      this.sourcesAddedToday.set(res.sourcesAddedToday);
    });
  }

  loadSources() {
    this.http.get<any[]>('http://localhost:3000/admin/sources').subscribe(res => {
      this.sources.set(res);
    });
  }

  loadUsers() {
    this.http.get<any[]>('http://localhost:3000/auth/users').subscribe(res => {
      console.log('[AdminHub] Received users:', res.length);
      this.allUsers.set(res);
      this.totalReaders.set(res.length);
    });
  }

  loadPendingRequests() {
    this.http.get<any[]>('http://localhost:3000/onboarding/requests').subscribe(res => {
      this.pendingRequests.set(res);
    });
  }

  // --- User Actions ---
  switchUsersTab(tab: string) {
    this.usersSubTab.set(tab);
  }

  editUser(user: any) {
    this.editingUser.set({ ...user });
  }

  cancelEdit() {
    this.editingUser.set(null);
  }

  saveUser() {
    const user = this.editingUser();
    if (!user) return;
    this.http.patch(`http://localhost:3000/auth/users/${user.id}`, user).subscribe(() => {
      this.editingUser.set(null);
      this.loadUsers();
    });
  }

  deleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.http.delete(`http://localhost:3000/auth/users/${id}`).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  restoreUser(id: string) {
    this.http.post(`http://localhost:3000/auth/users/${id}/restore`, {}).subscribe(() => {
      this.loadUsers();
    });
  }

  // --- Publisher Actions ---
  sendInvite() {
    const email = this.inviteEmail();
    if (!email) return;
    this.http.post<any>('http://localhost:3000/onboarding/invite', { email }).subscribe(res => {
      this.lastInviteLink.set(res.inviteLink);
      this.inviteEmail.set('');
      alert('Invite generated! Copy the link below.');
    });
  }

  approveRequest(id: string) {
    this.http.post<any>(`http://localhost:3000/onboarding/approve/${id}`, {}).subscribe(res => {
      alert('Publisher Approved! Link: ' + res.activationLink);
      this.loadPendingRequests();
      this.loadUsers();
    });
  }

  rejectRequest(id: string) {
    if (confirm('Are you sure you want to reject this registration?')) {
      this.http.post<any>(`http://localhost:3000/onboarding/reject/${id}`, {}).subscribe(() => {
        alert('Publisher Rejected.');
        this.loadPendingRequests();
      });
    }
  }

  onLogout() {
    this.authService.logout();
  }
}