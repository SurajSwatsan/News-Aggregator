import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { AuthService } from '../../auth/auth';
import { Router, RouterLink, ActivatedRoute, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toast.service';
import { ProfileDropdownComponent } from '../profile-dropdown/profile-dropdown';
import { CreatedAdsComponent } from '../common/created-ads/created-ads';
import { MasterComponent } from '../master/master';
import { AdminSubscriptionComponent } from './admin-subscription/admin-subscription';
import { FloatingInputComponent } from '../common/floating-input/floating-input';
import { FloatingSelectComponent } from '../common/floating-select/floating-select';
import { UserManagementComponent } from '../user-management/user-management';
import { UiService } from '../../services/ui.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, ProfileDropdownComponent, CreatedAdsComponent, MasterComponent, AdminSubscriptionComponent, UserManagementComponent, TitleCasePipe, DatePipe, FloatingInputComponent, FloatingSelectComponent],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  public authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public uiService = inject(UiService);

  user = computed(() => this.authService.currentUser());
  activeTab = signal('overview');
  isMasterExpanded = signal(false);

  headerTitle = computed(() => {
    switch (this.activeTab()) {
      case 'overview': return 'Admin System Overview';
      case 'sources': return 'News Sources Management';
      case 'users': return 'Platform User Management';
      case 'audit': return 'Security & Audit Logs';
      case 'ads': return 'Advertising Center';
      case 'master': return 'Master Data Management';
      case 'subscriptions': return 'User Subscription Management';
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
      case 'master': return 'Platform-wide Geography & Metadata Configuration';
      case 'subscriptions': return 'Track Reader Credits & Membership Statuses';
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
      case 'master': 
        const tab = this.route.snapshot.queryParams['tab'] || 'countries';
        current = tab === 'countries' ? 'Country Master' : 'City Master';
        break;
      case 'subscriptions': current = 'Subscriptions'; break;
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

  // User Management State Removed (Moved to UserManagementComponent)
  
  auditLogs = signal<any[]>([]);
  refreshTrigger = signal(0);
  isUploadingAdAsset = signal(false);
  viewingAd = signal<any>(null);
  isCreatingAd = signal(false);
  editingAdId = signal<string | null>(null);
  isSubscriptionModalActive = signal(false); // Track child modal state

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

  adTypeOptions = [
    { value: 'image', label: 'Image Banner' },
    { value: 'video', label: 'Video Ad' },
    { value: 'text', label: 'Sponsored Content' }
  ];

  placementOptions = [
    { value: 'sidebar', label: 'Sidebar Widget' },
    { value: 'header', label: 'Site Header' },
    { value: 'in-feed', label: 'News Feed Item' },
    { value: 'floating', label: 'Floating (Bottom-Right)' }
  ];

  // User Management Logic moved to UserManagementComponent


  ngOnInit() {
    this.route.url.subscribe(url => {
      const path = url[0]?.path;
      if (path === 'sources') {
        this.activeTab.set('sources');
      } else if (path === 'user' || path === 'readers') {
        this.activeTab.set('users');
      } else if (path === 'audit') {
        this.activeTab.set('audit');
        this.loadAuditLogs();
      } else if (path === 'ads') {
        this.activeTab.set('ads');
      } else if (path === 'master') {
        this.activeTab.set('master');
        this.isMasterExpanded.set(true);
      } else if (path === 'subscriptions') {
        this.activeTab.set('subscriptions');
      } else {
        this.activeTab.set('overview');
      }
    });
    this.loadAllData();
  }

  loadAllData() {
    this.loadStats();
    this.loadSources();
  }

  loadStats() {
    this.http.get<any>('http://localhost:3000/admin/stats').subscribe(res => {
      this.totalArticles.set(res.totalArticles);
      this.activeSources.set(res.totalSources);
      this.sourcesAddedToday.set(res.sourcesAddedToday);
      this.totalReaders.set(res.totalReaders);
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

  loadAuditLogs() {
    const page = this.auditPage();
    this.http.get<any>(`http://localhost:3000/admin/audit-logs?page=${page}&limit=${this.pageSize}`).subscribe(res => {
      this.auditLogs.set(res.data);
      this.auditTotal.set(res.total);
      this.auditTotalPages.set(res.totalPages);
    });
  }

  setPageSources(p: number) {
    if (p < 1 || p > this.sourcesTotalPages()) return;
    this.sourcesPage.set(p);
    this.loadSources();
  }

  setPageAudit(p: number) {
    if (p < 1 || p > this.auditTotalPages()) return;
    this.auditPage.set(p);
    this.loadAuditLogs();
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
    this.uiService.isModalOpen.set(true);
  }

  closeAdModal() {
    this.isCreatingAd.set(false);
    this.editingAdId.set(null);
    this.uiService.isModalOpen.set(false);
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
        this.uiService.isModalOpen.set(false);
        this.refreshTrigger.update(v => v + 1);
      },
      error: () => this.toast.show(isEditing ? 'Failed to update campaign' : 'Failed to create campaign', 'error')
    });
  }

  // --- File Upload ---
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      // Auto-detect ad type
      if (file.type.startsWith('image/')) {
        this.newAd.update(ad => ({ ...ad, adType: 'image' }));
      } else if (file.type.startsWith('video/')) {
        this.newAd.update(ad => ({ ...ad, adType: 'video' }));
      }
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