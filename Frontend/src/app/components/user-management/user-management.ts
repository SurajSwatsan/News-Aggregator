import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../services/toast.service';
import { FloatingInputComponent } from '../common/floating-input/floating-input';
import { FloatingSelectComponent } from '../common/floating-select/floating-select';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, FloatingInputComponent, FloatingSelectComponent],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  // User Management State
  usersSubTab = signal('all');
  allUsers = signal<any[]>([]);
  editingUser = signal<any | null>(null);
  viewingDetails = signal<any | null>(null);
  pendingRequests = signal<any[]>([]);
  inviteEmail = signal('');
  lastInviteLink = signal<string | null>(null);
  totalReaders = signal(0);

  // Pagination
  pageSize = 10;
  usersPage = signal(1);
  usersTotal = signal(0);
  usersTotalPages = signal(0);

  // Statistics
  totalActiveUsersCount = computed(() => this.allUsers().length);
  totalPublishersCount = computed(() => this.allUsers().filter(u => u.role === 'publisher').length);
  pendingPublishersCount = computed(() => this.pendingRequests().length);

  filteredUsers = computed(() => {
    const tab = this.usersSubTab();
    const users = this.allUsers();
    if (tab === 'readers') return users.filter(u => u.role === 'reader');
    return users;
  });

  publishers = computed(() => {
    const activeRaw = this.allUsers().filter(u => u.role === 'publisher' && !u.isDeleted);
    const pendingRaw = this.pendingRequests().filter(p => (p.requestedRole || p.role) === 'publisher');
    const pendingEmails = new Set(pendingRaw.map(p => p.email.toLowerCase()));

    const active = activeRaw
      .filter(u => !pendingEmails.has(u.email.toLowerCase()))
      .map(u => ({ ...u, status: 'Active', isPending: false }));

    const pending = pendingRaw.map(p => ({
      ...p,
      name: p.publisherName || p.orgName || 'New Publisher',
      isPending: true,
      role: 'publisher',
      status: 'Pending Approval'
    }));

    return [...pending, ...active];
  });

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.loadUsers();
    this.loadPendingRequests();
    this.loadStats();
  }

  loadStats() {
    this.http.get<any>('http://localhost:3000/admin/stats').subscribe(res => {
      this.totalReaders.set(res.totalReaders);
    });
  }

  loadUsers() {
    const page = this.usersPage();
    this.http.get<any>(`http://localhost:3000/auth/users?page=${page}&limit=${this.pageSize}`).subscribe(res => {
      this.allUsers.set(res.data);
      this.usersTotal.set(res.total);
      this.usersTotalPages.set(res.totalPages);
    });
  }

  loadPendingRequests() {
    this.http.get<any[]>('http://localhost:3000/onboarding/requests').subscribe(res => {
      this.pendingRequests.set(res);
    });
  }

  setPageUsers(p: number) {
    if (p < 1 || p > this.usersTotalPages()) return;
    this.usersPage.set(p);
    this.loadUsers();
  }

  switchUsersTab(tab: string) {
    this.usersSubTab.set(tab);
  }

  approveRequest(id: string) {
    this.http.post<any>(`http://localhost:3000/onboarding/approve/${id}`, {}).subscribe({
      next: (res) => {
        this.toast.show('✅ ' + res.message);
        this.loadPendingRequests();
        this.loadUsers();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to approve.';
        this.toast.show('❌ Error: ' + msg, 'error');
      }
    });
  }

  rejectRequest(id: string) {
    if (confirm('Are you sure you want to reject this registration?')) {
      this.http.post<any>(`http://localhost:3000/onboarding/reject/${id}`, {}).subscribe(() => {
        this.toast.show('Publisher Rejected.', 'info');
        this.loadPendingRequests();
      });
    }
  }

  deleteUser(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.http.delete(`http://localhost:3000/auth/users/${id}`).subscribe(() => {
        this.loadUsers();
      });
    }
  }

  viewDetails(user: any) {
    this.viewingDetails.set({ ...user });
  }

  editUser(user: any) {
    this.editingUser.set({ ...user });
  }

  saveUser() {
    const user = this.editingUser();
    if (!user) return;
    this.http.patch(`http://localhost:3000/auth/users/${user.id}`, { role: user.role }).subscribe({
      next: () => {
        this.toast.show('✅ User permissions updated!');
        this.editingUser.set(null);
        this.loadUsers();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to update user.';
        this.toast.show('❌ Error: ' + msg, 'error');
      }
    });
  }

  closeModals() {
    this.viewingDetails.set(null);
    this.editingUser.set(null);
  }

  sendInvite() {
    const email = this.inviteEmail();
    if (!email) return;
    this.http.post<any>('http://localhost:3000/onboarding/invite', { email }).subscribe(res => {
      this.lastInviteLink.set(res.inviteLink);
      this.inviteEmail.set('');
      this.toast.show('Invite generated!');
    });
  }

  copyInviteLink() {
    const link = this.lastInviteLink();
    if (link) {
      navigator.clipboard.writeText(link);
      this.toast.show('Linked copied!');
    }
  }
}
