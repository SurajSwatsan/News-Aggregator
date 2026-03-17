import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './user-management.html',
  styleUrl: './user-management.css'
})
export class UserManagementComponent implements OnInit {
  private http = inject(HttpClient);
  public authService = inject(AuthService);
  private router = inject(Router);
  
  user = computed(() => this.authService.currentUser());
  userSubTab = signal('all');

  // Management Data
  pendingRequests = signal<any[]>([]);
  allUsers = signal<any[]>([]);
  
  filteredUsers = computed(() => {
    const tab = this.userSubTab();
    const users = this.allUsers();
    if (tab === 'deleted') {
      return users.filter(u => u.isDeleted);
    } else if (tab === 'all') {
      return users.filter(u => !u.isDeleted);
    }
    return users;
  });

  editingUser = signal<any | null>(null);
  
  // Invite logic
  inviteEmail = '';
  lastInviteLink = signal<string | null>(null);

  ngOnInit() {
    this.loadPendingRequests();
    this.loadUsers();
  }

  switchUserSubTab(tab: string) {
    this.userSubTab.set(tab);
  }

  loadPendingRequests() {
    this.http.get<any[]>('http://localhost:3000/onboarding/requests').subscribe(res => {
      this.pendingRequests.set(res);
    });
  }

  loadUsers() {
    this.http.get<any[]>('http://localhost:3000/auth/users').subscribe(res => {
      this.allUsers.set(res);
    });
  }

  sendInvite() {
    if (!this.inviteEmail) return;
    this.http.post<any>('http://localhost:3000/onboarding/invite', { email: this.inviteEmail }).subscribe(res => {
      this.lastInviteLink.set(res.inviteLink);
      this.inviteEmail = '';
      alert('Invite generated! Copy the link below.');
    });
  }

  approveRequest(id: string) {
    this.http.post<any>(`http://localhost:3000/onboarding/approve/${id}`, {}).subscribe(res => {
      alert(res.message + '\n\nLink: ' + res.activationLink);
      this.loadPendingRequests();
      this.loadUsers();
    });
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

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
