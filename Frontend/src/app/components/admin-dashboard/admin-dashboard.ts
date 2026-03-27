import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth';
import { Router, RouterLink, ActivatedRoute, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { ProfileDropdownComponent } from '../profile-dropdown/profile-dropdown';
import { CreatedAdsComponent } from '../created-ads/created-ads';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, ProfileDropdownComponent, CreatedAdsComponent, TitleCasePipe, DatePipe],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  user = computed(() => this.authService.currentUser());
  activeTab = signal('overview');

  headerTitle = computed(() => {
    switch (this.activeTab()) {
      case 'overview': return 'Admin System Overview';
      case 'sources': return 'News Sources Management';
      case 'users': return 'Platform User Management';
      case 'audit': return 'Security & Audit Logs';
      case 'ads': return 'Advertising Center';
      default: return 'Administrative Control Center';
    }
  });

  headerSubtitle = computed(() => {
    switch (this.activeTab()) {
      case 'overview': return 'System Performance & Real-time Activity Hub';
      case 'sources': return 'Global News Feed & RSS Integration Management';
      case 'users': return 'Platform User Access & Resource Allocation';
      case 'audit': return 'Security Trail & System Operation History';
      case 'ads': return 'Campaign Performance & Asset Delivery Management';
      default: return 'Administrative Control Center';
    }
  });

  breadcrumbTrail = computed(() => {
    let current = '';
    switch (this.activeTab()) {
      case 'overview': current = 'Overview'; break;
      case 'sources': current = 'News Sources'; break;
      case 'users': current = 'User Management'; break;
      case 'audit': current = 'Audit Logs'; break;
      case 'ads': current = 'Advertising Center'; break;
      default: current = 'Dashboard'; break;
    }
    return { root: 'Platform', current };
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
  viewingDetails = signal<any | null>(null);
  pendingRequests = signal<any[]>([]);
  inviteEmail = signal('');
  lastInviteLink = signal<string | null>(null);
  auditLogs = signal<any[]>([]);
  refreshTrigger = signal(0);
  isUploadingAdAsset = signal(false);
  viewingAd = signal<any>(null);
  isCreatingAd = signal(false);
  editingAdId = signal<string | null>(null);

  // Pagination Signals
  pageSize = 10;
  sourcesPage = signal(1);
  sourcesTotal = signal(0);
  sourcesTotalPages = signal(0);

  usersPage = signal(1);
  usersTotal = signal(0);
  usersTotalPages = signal(0);

  auditPage = signal(1);
  auditTotal = signal(0);
  auditTotalPages = signal(0);

  newAd = signal({
    title: '',
    adType: 'image',
    mediaUrl: '',
    targetUrl: '',
    placementType: 'sidebar',
    position: 0,
    isActive: true,
    startTime: '' as string | null,
    endTime: '' as string | null
  });

  filteredUsers = computed(() => {
    const tab = this.usersSubTab();
    const users = this.allUsers();

    switch (tab) {
      case 'readers':
        return users.filter(u => u.role === 'reader');
      default:
        return users;
    }
  });

  // Data helpers
  publishers = computed(() => {
    const activeRaw = this.allUsers().filter(u => u.role === 'publisher' && !u.isDeleted);
    const pendingRaw = this.pendingRequests().filter(p => (p.requestedRole || p.role) === 'publisher');

    // Map email to pending request for quick lookup and deduplication
    const pendingEmails = new Set(pendingRaw.map(p => p.email.toLowerCase()));

    const active = activeRaw
      .filter(u => !pendingEmails.has(u.email.toLowerCase())) // Hide active if pending exists
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
      } else if (path === 'audit') {
        this.activeTab.set('audit');
        this.loadAuditLogs();
      } else if (path === 'ads') {
        this.activeTab.set('ads');
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
    const page = this.sourcesPage();
    this.http.get<any>(`http://localhost:3000/admin/sources?page=${page}&limit=${this.pageSize}`).subscribe(res => {
      this.sources.set(res.data);
      this.sourcesTotal.set(res.total);
      this.sourcesTotalPages.set(res.totalPages);
      // Update global stat if needed, though this is now sync with total
      this.activeSources.set(res.total);
    });
  }

  loadUsers() {
    const page = this.usersPage();
    this.http.get<any>(`http://localhost:3000/auth/users?page=${page}&limit=${this.pageSize}`).subscribe(res => {
      this.allUsers.set(res.data);
      this.usersTotal.set(res.total);
      this.usersTotalPages.set(res.totalPages);
      // For reader total stat, keep it simple by fetching from stats endpoint or filtering if page is large
      this.loadStats();
    });
  }

  loadPendingRequests() {
    this.http.get<any[]>('http://localhost:3000/onboarding/requests').subscribe(res => {
      this.pendingRequests.set(res);
    });
  }

  loadAuditLogs() {
    const page = this.auditPage();
    this.http.get<any>(`http://localhost:3000/admin/audit-logs?page=${page}&limit=${this.pageSize}`).subscribe(res => {
      this.auditLogs.set(res.data);
      this.auditTotal.set(res.total);
      this.auditTotalPages.set(res.totalPages);
    });
  }

  // --- Pagination Actions ---
  setPageSources(p: number) {
    if (p < 1 || p > this.sourcesTotalPages()) return;
    this.sourcesPage.set(p);
    this.loadSources();
  }

  setPageUsers(p: number) {
    if (p < 1 || p > this.usersTotalPages()) return;
    this.usersPage.set(p);
    this.loadUsers();
  }

  setPageAudit(p: number) {
    if (p < 1 || p > this.auditTotalPages()) return;
    this.auditPage.set(p);
    this.loadAuditLogs();
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

  viewDetails(data: any) {
    if (data.isPending) {
      // It's a pending request onboarding object
      this.viewingDetails.set(data);
    } else {
      // It's a completed user - we might want to fetch their onboarding data too if needed
      // For now just show user data
      this.viewingDetails.set({ ...data, isUser: true });
    }
  }

  closeDetails() {
    this.viewingDetails.set(null);
  }


  // --- Publisher Actions ---
  sendInvite() {
    const email = this.inviteEmail();
    if (!email) return;
    this.http.post<any>('http://localhost:3000/onboarding/invite', { email }).subscribe(res => {
      this.lastInviteLink.set(res.inviteLink);
      this.inviteEmail.set('');
      this.toast.show('Invite generated! Link below.');
    });
  }


  copyInviteLink() {
    const link = this.lastInviteLink();
    if (link) {
      navigator.clipboard.writeText(link);
      this.toast.show('Link copied to clipboard!');
    }
  }

  approveRequest(id: string) {
    this.http.post<any>(`http://localhost:3000/onboarding/approve/${id}`, {}).subscribe({
      next: (res) => {
        this.toast.show('✅ ' + res.message);
        this.viewingDetails.set(null);
        this.loadPendingRequests();
        this.loadUsers();
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to approve publisher. Please try again.';
        this.toast.show('❌ Error: ' + msg, 'error');
        console.error('[AdminDashboard] Approve failed:', err);
      }
    });
  }

  rejectRequest(id: string) {
    if (confirm('Are you sure you want to reject this registration?')) {
      this.http.post<any>(`http://localhost:3000/onboarding/reject/${id}`, {}).subscribe(() => {
        this.toast.show('Publisher Rejected.', 'info');
        this.viewingDetails.set(null);
        this.loadPendingRequests();
      });
    }
  }

  onLogout() {
    this.authService.logout();
  }

  // --- Ad Creation ---
  openAdModal(ad?: any) {
    if (ad) {
      this.editingAdId.set(ad.id);
      this.newAd.set({
        title: ad.title,
        adType: ad.adType,
        mediaUrl: ad.mediaUrl,
        targetUrl: ad.targetUrl,
        placementType: ad.placementType,
        position: ad.position,
        isActive: ad.isActive,
        startTime: ad.startTime ? new Date(ad.startTime).toISOString().slice(0, 16) : '',
        endTime: ad.endTime ? new Date(ad.endTime).toISOString().slice(0, 16) : ''
      });
    } else {
      this.editingAdId.set(null);
      this.resetAdForm();
    }
    this.isCreatingAd.set(true);
  }

  closeAdModal() {
    this.isCreatingAd.set(false);
    this.editingAdId.set(null);
  }

  saveGlobalAd() {
    const adData = this.newAd();
    if (!adData.title || !adData.targetUrl) {
      this.toast.show('Title and Target URL are required', 'error');
      return;
    }

    const isEditing = !!this.editingAdId();
    const url = isEditing
      ? `http://localhost:3000/admin/ads/${this.editingAdId()}`
      : 'http://localhost:3000/admin/ads';

    const request = isEditing
      ? this.http.patch(url, adData)
      : this.http.post(url, adData);

    request.subscribe({
      next: () => {
        this.toast.show(isEditing ? 'Campaign updated successfully!' : 'Campaign launched successfully!', 'success');
        this.isCreatingAd.set(false);
        this.editingAdId.set(null);
        this.resetAdForm();
        this.refreshTrigger.update(v => v + 1);
      },
      error: () => this.toast.show(isEditing ? 'Failed to update campaign' : 'Failed to create campaign', 'error')
    });
  }

  // --- File Upload ---
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadAdAsset(file);
    }
  }

  uploadAdAsset(file: File) {
    this.isUploadingAdAsset.set(true);
    const formData = new FormData();
    formData.append('file', file);

    this.http.post<{ url: string }>('http://localhost:3000/admin/ads/upload', formData).subscribe({
      next: (res) => {
        this.newAd.update(ad => ({ ...ad, mediaUrl: res.url }));
        this.isUploadingAdAsset.set(false);
        this.toast.show('Asset uploaded successfully!', 'success');
      },
      error: () => {
        this.isUploadingAdAsset.set(false);
        this.toast.show('Failed to upload asset', 'error');
      }
    });
  }

  openAdViewer(ad: any) {
    this.viewingAd.set(ad);
  }

  closeAdViewer() {
    this.viewingAd.set(null);
  }

  resetAdForm() {
    this.newAd.set({
      title: '',
      adType: 'image',
      mediaUrl: '',
      targetUrl: '',
      placementType: 'sidebar',
      position: 0,
      isActive: true,
      startTime: '',
      endTime: ''
    });
  }
}