import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe, UpperCasePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-publisher-ads',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TitleCasePipe, UpperCasePipe, DecimalPipe],
  template: `
    <div class="publisher-ads-container animate-fade-in">
      <!-- High-Level Stats Overview -->
      <div class="ads-stats-grid">
        <div class="stat-mini">
          <span class="label">ACTIVE CAMPAIGNS</span>
          <span class="value">{{ activeAdsCount() }}</span>
        </div>
        <div class="stat-mini">
          <span class="label">TOTAL IMPRESSIONS</span>
          <span class="value">{{ totalImpressions() | number }}</span>
        </div>
        <div class="stat-mini highlight">
          <span class="label">TOTAL CLICKS</span>
          <span class="value">{{ totalClicks() | number }}</span>
        </div>
        <div class="stat-mini">
          <span class="label">AVERAGE CTR</span>
          <span class="value">{{ ctr() }}%</span>
        </div>
      </div>

      <!-- Management Controls Row -->
      <div class="controls-row-wrapper">
        <div class="search-refined">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Filter your campaigns...">
        </div>
        <button class="btn-create-premium" (click)="openAdModal()">
          <div class="btn-icon-box">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="3"><path d="M12 5v14M5 12h14" /></svg>
          </div>
          <span>New Campaign</span>
        </button>
      </div>

      <!-- Inventory Section -->
      <div class="inventory-section">
        <div class="inventory-header">
          <div class="label-group">
            <h2 class="section-title">Campaign Inventory</h2>
            <span class="count-chip">{{ filteredAds().length }} Items</span>
          </div>
          <div class="filters-premium">
            <select class="select-refined" [ngModel]="filterType()" (ngModelChange)="filterType.set($event)">
              <option value="all">All Channels</option>
              <option value="image">Image Display</option>
              <option value="video">Video Shorts</option>
              <option value="text">Sponsored Content</option>
            </select>
          </div>
        </div>

        <div class="campaign-list-wrapper">
          <!-- Table Header -->
          <div class="inventory-grid-header">
            <span class="col-main">CAMPAIGN NAME</span>
            <span class="col-meta">TYPE</span>
            <span class="col-meta">PLACEMENT</span>
            <span class="col-meta">DATE</span>
            <span class="col-perf">PERFORMANCE</span>
            <span class="col-status">STATUS</span>
            <span class="col-actions">ACTIONS</span>
          </div>

          <!-- Item Rows -->
          <div class="inventory-item-row" *ngFor="let ad of filteredAds()">
            <div class="col-main creative-cell">
              <div class="creative-preview-box" [style.background-image]="'url(' + ad.mediaUrl + ')'">
                <div class="no-asset" *ngIf="!ad.mediaUrl">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
              </div>
              <div class="creative-meta">
                <span class="creative-title">{{ ad.title }}</span>
                <span class="creative-url" [title]="ad.targetUrl">{{ ad.targetUrl }}</span>
              </div>
            </div>

            <div class="col-meta">
              <span class="pill-type" [class]="ad.adType">{{ ad.adType | uppercase }}</span>
            </div>

            <div class="col-meta audience-label">
              {{ ad.placementType | titlecase }}
            </div>
            
            <div class="col-meta date-label">
              {{ ad.createdAt | date:'MMM d, y' }}
            </div>

            <div class="col-perf performance-visual">
              <div class="stat-mini-table">
                <span class="val">{{ ad.impressions | number }}</span>
                <span class="unit">VWS</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-mini-table highlight">
                <span class="val">{{ ad.clicks | number }}</span>
                <span class="unit">CLK</span>
              </div>
            </div>

            <div class="col-status">
              <div class="status-badge-refined" [class]="ad.status">
                {{ ad.status | titlecase }}
              </div>
              <div class="status-sub-label" *ngIf="ad.status === 'active' || ad.status === 'ACTIVE'">
                {{ ad.isActive ? 'Delivering' : 'Paused' }}
              </div>
            </div>

            <div class="col-actions action-set">
              <button class="icon-btn-refined" (click)="viewDetails(ad)" title="Insights">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" /><circle cx="12" cy="12" r="3" /></svg>
              </button>
              <button class="icon-btn-refined" (click)="openAdModal(ad)" title="Modify">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
              <button class="icon-btn-refined toggle" [class.is-active]="ad.isActive" (click)="toggleAd(ad)" 
                [title]="ad.isActive ? 'Suspend' : 'Resume'" [disabled]="ad.status !== 'active' && ad.status !== 'ACTIVE'">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" *ngIf="ad.isActive"/>
                  <path d="M8 5v14l11-7L8 5z" *ngIf="!ad.isActive"/>
                </svg>
              </button>
              <button class="icon-btn-refined danger" (click)="deleteAd(ad.id)" title="Terminate">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div class="premium-empty-state" *ngIf="filteredAds().length === 0">
            <div class="empty-icon-box">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
            </div>
            <h3>No Campaigns Found</h3>
            <p>Your search or filter criteria returned zero results. Adjust your selection or create a new campaign.</p>
          </div>
        </div>
      </div>

      <!-- Global Ad Creation Modal (Mirrored from Admin) -->
      <div class="modal-overlay-new" *ngIf="isCreatingAd()">
        <div class="modal-wrapper animate-slide-in">
          <div class="modal-top">
            <div class="badge-new">{{ editingAdId() ? 'UPDATE' : 'LAUNCH' }} CAMPAIGN</div>
            <button class="btn-close-new" (click)="closeAdModal()">&times;</button>
          </div>

          <div class="modal-content-new">
            <div class="refined-form">
              <div class="row">
                <div class="input-block full">
                  <label>Campaign Title</label>
                  <input type="text" [ngModel]="newAd().title" (ngModelChange)="newAd.set({...newAd(), title: $event})" 
                    placeholder="e.g. Premium Subscription Sale">
                </div>
              </div>

              <div class="row split">
                <div class="input-block">
                  <label>Ad Type</label>
                  <select [ngModel]="newAd().adType" (ngModelChange)="newAd.set({...newAd(), adType: $event})">
                    <option value="image">Image Banner</option>
                    <option value="video">Video Ad</option>
                    <option value="text">Sponsored Content</option>
                  </select>
                </div>
                <div class="input-block">
                  <label>Placement</label>
                  <select [ngModel]="newAd().placementType" (ngModelChange)="newAd.set({...newAd(), placementType: $event})">
                    <option value="sidebar">Sidebar Widget</option>
                    <option value="header">Site Header</option>
                    <option value="in-feed">News Feed Item</option>
                  </select>
                </div>
              </div>

              <div class="row split">
                <div class="input-block">
                  <label>Start Delivery</label>
                  <input type="datetime-local" [ngModel]="newAd().startTime" (ngModelChange)="newAd.set({...newAd(), startTime: $event})">
                </div>
                <div class="input-block">
                  <label>End Delivery</label>
                  <input type="datetime-local" [ngModel]="newAd().endTime" (ngModelChange)="newAd.set({...newAd(), endTime: $event})">
                </div>
              </div>

              <div class="row">
                <div class="input-block full">
                  <label>Media Asset URL</label>
                  <div class="input-group-with-action">
                    <input type="text" [ngModel]="newAd().mediaUrl" (ngModelChange)="newAd.set({...newAd(), mediaUrl: $event})" 
                      placeholder="https://image-hosting.com/my-ad.jpg">
                    <button class="btn-browse" (click)="fileInput.click()" [disabled]="isUploadingAdAsset()">
                      <span *ngIf="!isUploadingAdAsset()">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 9l5-5 5 5M12 4v12"/>
                        </svg>
                        Browse
                      </span>
                      <div class="mini-loader" *ngIf="isUploadingAdAsset()"></div>
                    </button>
                  </div>
                  <input #fileInput type="file" (change)="onFileSelected($event)" style="display: none">
                </div>
              </div>

              <div class="row">
                <div class="input-block full">
                  <label>Target Redirect URL</label>
                  <input type="text" [ngModel]="newAd().targetUrl" (ngModelChange)="newAd.set({...newAd(), targetUrl: $event})" 
                    placeholder="https://yourwebsite.com/offer">
                </div>
              </div>
            </div>
          </div>

          <div class="modal-bottom">
            <button class="btn-secondary-new" (click)="closeAdModal()">Cancel</button>
            <button class="btn-primary-new" (click)="saveAd()">{{ editingAdId() ? 'Update Changes' : 'Launch Campaign' }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .publisher-ads-container { padding: 0; min-height: 100vh; background: #f8fafc; }
    
    /* Stats Row Refined */
    .ads-stats-grid { 
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; 
      padding: 2rem 2rem 0; max-width: 1600px; margin: 0 auto; 
    }
    .stat-mini { 
      background: #fff; padding: 1.5rem; border-radius: 20px; 
      border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.5rem;
      transition: transform 0.2s;
    }
    .stat-mini:hover { transform: translateY(-3px); }
    .stat-mini .label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; }
    .stat-mini .value { font-size: 1.5rem; font-weight: 900; color: #0f172a; }
    .stat-mini.highlight .value { color: #f59e0b; }

    /* Controls Row */
    .controls-row-wrapper {
      display: grid; grid-template-columns: 7fr 3fr; gap: 1rem;
      padding: 2rem; max-width: 1600px; margin: 0 auto; width: 100%; box-sizing: border-box;
    }
    .search-refined {
      position: relative; display: flex; align-items: center;
    }
    .search-refined svg { position: absolute; left: 1.25rem; color: #94a3b8; }
    .search-refined input {
      width: 100%; padding: 0.875rem 1.25rem 0.875rem 3.5rem;
      background: #fff; border: 2px solid #e2e8f0; border-radius: 16px;
      font-size: 0.95rem; font-weight: 600; color: #1e293b; outline: none; transition: all 0.3s;
    }
    .search-refined input:focus { border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    
    .btn-create-premium {
      display: flex; align-items: center; justify-content: center; gap: 0.75rem;
      padding: 0.875rem 1.5rem; background: #0f172a; color: #fff; border: none;
      border-radius: 16px; font-weight: 800; font-size: 0.9rem; cursor: pointer;
      transition: all 0.3s; box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2);
    }
    .btn-create-premium:hover { background: #1e293b; transform: translateY(-2px); }
    .btn-icon-box { width: 24px; height: 24px; background: rgba(255,255,255,0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; }

    /* Inventory Section */
    .inventory-section { padding: 0 2rem 4rem; max-width: 1600px; margin: 0 auto; }
    .inventory-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .label-group { display: flex; align-items: center; gap: 1rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; }
    .count-chip { background: #f1f5f9; color: #64748b; padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; }
    .select-refined {
      background: #fff; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem;
      border-radius: 14px; font-weight: 700; font-size: 0.85rem; color: #475569; outline: none; cursor: pointer;
    }

    /* Table Grid */
    .campaign-list-wrapper { background: #fff; border-radius: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden; }
    .inventory-grid-header {
      display: grid; grid-template-columns: 2.2fr 80px 110px 110px 140px 90px 130px;
      padding: 0.75rem 1.5rem; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; gap: 1rem; align-items: center;
    }
    .inventory-grid-header span { font-size: 0.65rem; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }

    .inventory-item-row {
      display: grid; grid-template-columns: 2.2fr 80px 110px 110px 140px 90px 130px;
      padding: 1rem 1.5rem; border-bottom: 1px solid #f1f5f9; gap: 1rem; align-items: center; transition: all 0.2s;
    }
    .inventory-item-row:hover { background: #f8fafc; }
    .inventory-item-row:last-child { border-bottom: none; }

    .creative-cell { display: flex; align-items: center; gap: 1rem; min-width: 0; }
    .creative-preview-box { width: 44px; height: 44px; border-radius: 10px; background-size: cover; background-position: center; flex-shrink: 0; border: 2px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
    .no-asset { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
    .creative-meta { display: flex; flex-direction: column; min-width: 0; }
    .creative-title { font-weight: 700; color: #1e293b; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .creative-url { font-size: 0.75rem; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .pill-type { padding: 3px 10px; border-radius: 6px; font-size: 0.6rem; font-weight: 800; background: #f1f5f9; color: #64748b; }
    .pill-type.image { background: #fee2e2; color: #ef4444; }
    .pill-type.video { background: #dbeafe; color: #3182ce; }
    .pill-type.text { background: #dcfce7; color: #059669; }

    .audience-label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .date-label { font-size: 0.8rem; font-weight: 600; color: #64748b; }

    .performance-visual { display: flex; align-items: center; gap: 0.75rem; }
    .stat-mini-table { display: flex; flex-direction: column; }
    .stat-mini-table .val { font-size: 0.95rem; font-weight: 800; color: #0f172a; line-height: 1; }
    .stat-mini-table .unit { font-size: 0.55rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-top: 2px; }
    .stat-mini-table.highlight .val { color: #f59e0b; }
    .stat-divider { width: 1px; height: 18px; background: #e2e8f0; }

    .status-badge-refined { 
      padding: 4px 10px; border-radius: 8px; font-size: 0.7rem; font-weight: 800; 
      text-transform: uppercase; display: inline-block;
    }
    .status-badge-refined.pending { background: #fef3c7; color: #d97706; }
    .status-badge-refined.approved { background: #dcfce7; color: #059669; }
    .status-badge-refined.rejected { background: #fecaca; color: #dc2626; }
    .status-sub-label { font-size: 0.6rem; font-weight: 700; color: #94a3b8; margin-top: 2px; text-transform: uppercase; }

    .action-set { display: flex; justify-content: flex-end; gap: 0.375rem; }
    .icon-btn-refined { 
      width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; 
      background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; color: #64748b; transition: all 0.2s;
    }
    .icon-btn-refined:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; transform: translateY(-1px); }
    .icon-btn-refined.toggle.is-active { color: #f59e0b; border-color: #fde68a; }
    .icon-btn-refined.danger:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }

    /* Empty State */
    .premium-empty-state { padding: 6rem 2rem; text-align: center; }
    .empty-icon-box { width: 64px; height: 64px; background: #f1f5f9; color: #94a3b8; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .premium-empty-state h3 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .premium-empty-state p { color: #64748b; font-size: 0.9rem; max-width: 320px; margin: 0 auto; line-height: 1.5; }

    /* Modal Mirrored Styles */
    .modal-overlay-new {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px) saturate(180%);
      display: flex; align-items: center; justify-content: center; padding: 2rem;
    }
    .modal-wrapper {
      background: #fff; width: 100%; max-width: 800px; max-height: 90vh;
      border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .modal-top {
      padding: 1.5rem 2.5rem; display: flex; justify-content: space-between;
      align-items: center; border-bottom: 1px solid #f0f0f0;
    }
    .badge-new {
      background: #f0f0f0; color: #666; padding: 0.4rem 1rem;
      border-radius: 100px; font-size: 0.7rem; font-weight: 700;
    }
    .btn-close-new {
      background: none; border: none; font-size: 2rem; color: #999;
      cursor: pointer; transition: color 0.2s;
    }
    .btn-close-new:hover { color: #000; }
    .modal-content-new { padding: 2.5rem; overflow-y: auto; flex: 1; }
    .refined-form { display: flex; flex-direction: column; gap: 1.5rem; }
    .input-block { display: flex; flex-direction: column; gap: 0.5rem; }
    .input-block label { font-size: 0.8rem; font-weight: 700; color: #444; text-transform: uppercase; letter-spacing: 0.05em; }
    .input-block input, .input-block select {
      background: #f8f9fa; border: 1px solid #eee; padding: 1rem 1.25rem;
      border-radius: 16px; font-size: 1rem; font-weight: 500; transition: all 0.3s;
    }
    .input-block input:focus, .input-block select:focus {
      outline: none; background: #fff; border-color: #000;
      box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05);
    }
    .input-group-with-action { display: flex; gap: 0.75rem; width: 100%; }
    .input-group-with-action input { flex: 1; }
    .btn-browse {
      display: flex; align-items: center; gap: 0.6rem; padding: 0 1.5rem;
      background: #f0f0f0; color: #333; border: 1px solid #eee;
      border-radius: 16px; font-weight: 600; font-size: 0.9rem;
      cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .btn-browse:hover:not(:disabled) { background: #000; color: #fff; border-color: #000; }
    .btn-browse:disabled { opacity: 0.6; cursor: default; }
    .mini-loader { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.1); border-top-color: currentColor; border-radius: 50%; animation: mini-spin 0.8s linear infinite; }
    @keyframes mini-spin { to { transform: rotate(360deg); } }

    .row.split { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .modal-bottom {
      padding: 1.5rem 2.5rem; background: #fcfcfc;
      display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid #f0f0f0;
    }
    .btn-secondary-new {
      background: transparent; border: 1px solid #eee; padding: 0.85rem 1.75rem;
      border-radius: 14px; font-weight: 600; color: #666; cursor: pointer;
    }
    .btn-primary-new {
      background: #000; border: none; padding: 0.85rem 2rem;
      border-radius: 14px; font-weight: 700; color: #fff; cursor: pointer;
      transition: transform 0.2s;
    }
    .btn-primary-new:hover { transform: translateY(-2px); opacity: 0.9; }

    @keyframes slideIn { from { opacity: 0; transform: translateY(30px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .animate-slide-in { animation: slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
  `]
})
export class PublisherAdsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  ads = signal<any[]>([]);
  searchQuery = signal('');
  filterType = signal('all');
  isCreatingAd = signal(false);
  editingAdId = signal<string | null>(null);
  isUploadingAdAsset = signal(false);

  filteredAds = computed(() => {
    let list = this.ads();

    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      list = list.filter(a => a.title.toLowerCase().includes(q) || a.targetUrl.toLowerCase().includes(q));
    }

    if (this.filterType() !== 'all') {
      list = list.filter(a => a.adType === this.filterType());
    }

    return list;
  });

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

  // Stats signals
  activeAdsCount = signal(0);
  totalImpressions = signal(0);
  totalClicks = signal(0);
  ctr = signal(0);

  ngOnInit() {
    this.loadAds();
  }

  loadAds() {
    this.http.get<any[]>('http://localhost:3000/publisher/ads').subscribe({
      next: (res) => {
        this.ads.set(res);
        this.calculateStats(res);
      }
    });
  }

  calculateStats(adsList: any[]) {
    const active = adsList.filter(a => a.isActive && (a.status === 'active' || a.status === 'ACTIVE')).length;
    const imps = adsList.reduce((acc, curr) => acc + (curr.impressions || 0), 0);
    const clicks = adsList.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
    const ctrVal = imps > 0 ? ((clicks / imps) * 100).toFixed(2) : '0.00';

    this.activeAdsCount.set(active);
    this.totalImpressions.set(imps);
    this.totalClicks.set(clicks);
    this.ctr.set(parseFloat(ctrVal));
  }

  openAdModal(ad?: any) {
    if (ad) {
      this.editingAdId.set(ad.id);
      this.newAd.set({
        title: ad.title,
        adType: ad.adType,
        mediaUrl: ad.mediaUrl,
        targetUrl: ad.targetUrl,
        placementType: ad.placementType,
        position: ad.position || 0,
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

  viewDetails(ad: any) {
    this.toast.show(`Performance insights for "${ad.title}" coming soon!`, 'info');
  }

  saveAd() {
    const adData = this.newAd();
    if (!adData.title || !adData.targetUrl) {
      this.toast.show('Title and Target URL are required', 'error');
      return;
    }

    const isEditing = !!this.editingAdId();
    const url = isEditing
      ? `http://localhost:3000/publisher/ads/${this.editingAdId()}`
      : 'http://localhost:3000/publisher/ads';

    const request = isEditing
      ? this.http.patch(url, adData)
      : this.http.post(url, adData);

    request.subscribe({
      next: () => {
        this.toast.show(isEditing ? 'Campaign updated successfully!' : 'Campaign launched successfully!', 'success');
        this.isCreatingAd.set(false);
        this.editingAdId.set(null);
        this.resetAdForm();
        this.loadAds();
      },
      error: () => this.toast.show(isEditing ? 'Failed to update campaign' : 'Failed to create campaign', 'error')
    });
  }

  toggleAd(ad: any) {
    this.http.patch(`http://localhost:3000/publisher/ads/${ad.id}`, { isActive: !ad.isActive }).subscribe({
      next: () => {
        this.loadAds();
        this.toast.show(ad.isActive ? 'Campaign Paused' : 'Campaign Activated', 'success');
      }
    });
  }

  deleteAd(id: string) {
    if (confirm('Permanently remove this campaign?')) {
      this.http.delete(`http://localhost:3000/publisher/ads/${id}`).subscribe({
        next: () => {
          this.toast.show('Campaign removed');
          this.loadAds();
        }
      });
    }
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

    this.http.post<{ url: string }>('http://localhost:3000/publisher/ads/upload', formData).subscribe({
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
}
