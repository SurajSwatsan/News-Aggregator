import { Component, OnInit, inject, signal, computed, HostListener, ElementRef, effect } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe, UpperCasePipe, DecimalPipe } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../services/toast.service';
import { UiService } from '../../../services/ui.service';
import { FloatingInputComponent } from '../../../components/common/floating-input/floating-input';
import { FloatingSelectComponent } from '../../../components/common/floating-select/floating-select';

@Component({
  selector: 'app-publisher-ads',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    TitleCasePipe,
    UpperCasePipe,
    DecimalPipe,
    FloatingInputComponent,
    FloatingSelectComponent
  ],
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
            <div class="custom-select-wrapper">
              <div class="custom-select-trigger" (click)="isFilterOpen.set(!isFilterOpen())" [class.active]="isFilterOpen()">
                <span>{{ filterTypeLabel() }}</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="chevron">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </div>
              
              <div class="custom-options-menu animate-fade-in" *ngIf="isFilterOpen()">
                <div class="custom-option" 
                     *ngFor="let opt of filterOptions" 
                     [class.selected]="filterType() === opt.value"
                     (click)="filterType.set(opt.value); isFilterOpen.set(false)">
                  {{ opt.label }}
                  <svg *ngIf="filterType() === opt.value" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </div>
            </div>
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
                <app-floating-input 
                  label="Campaign Title"
                  [ngModel]="newAd().title"
                  (ngModelChange)="newAd.set({...newAd(), title: $event})"
                  placeholder="e.g. Premium Subscription Sale">
                </app-floating-input>
              </div>

              <div class="row split">
                <app-floating-select
                  label="Ad Type"
                  [options]="adTypeOptions"
                  [ngModel]="newAd().adType"
                  (ngModelChange)="newAd.set({...newAd(), adType: $event})"
                  class="light-select">
                </app-floating-select>
                
                <app-floating-select
                  label="Placement"
                  [options]="placementOptions"
                  [ngModel]="newAd().placementType"
                  (ngModelChange)="newAd.set({...newAd(), placementType: $event})"
                  class="light-select">
                </app-floating-select>
              </div>

              <div class="row split">
                <app-floating-input 
                  type="datetime-local"
                  label="Start Delivery"
                  [ngModel]="newAd().startTime"
                  (ngModelChange)="newAd.set({...newAd(), startTime: $event})">
                </app-floating-input>
                
                <app-floating-input 
                  type="datetime-local"
                  label="End Delivery"
                  [ngModel]="newAd().endTime"
                  (ngModelChange)="newAd.set({...newAd(), endTime: $event})">
                </app-floating-input>
              </div>

              <div class="row">
                <div class="input-block full">
                  <!-- Premium Upload Zone (Shown when no mediaUrl) -->
                  <div class="upload-zone-premium" *ngIf="!newAd().mediaUrl" (click)="fileInput.click()">
                    <div class="upload-icon-box" [class.syncing]="isUploadingAdAsset()">
                      <svg *ngIf="!isUploadingAdAsset()" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                      </svg>
                      <div class="loader-premium" *ngIf="isUploadingAdAsset()"></div>
                    </div>
                    <div class="upload-text-group">
                      <span class="upload-title">{{ isUploadingAdAsset() ? 'Uploading Asset...' : 'Upload Campaign Media' }}</span>
                      <span class="upload-subtitle">Drag and drop or click to browse (Image or Video)</span>
                    </div>
                  </div>

                  <!-- Media Preview Section (Shown when mediaUrl exists) -->
                  <div class="media-preview-premium animate-fade-in" *ngIf="newAd().mediaUrl">
                    <div class="preview-header">
                      <div class="preview-meta-info">
                        <span class="preview-label">LIVE PREVIEW</span>
                        <span class="asset-type-badge">{{ newAd().adType | uppercase }}</span>
                      </div>
                      <div class="preview-actions">
                        <button class="btn-action-small" (click)="fileInput.click()" title="Replace Media">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                          Change
                        </button>
                        <button class="btn-remove-asset-premium" (click)="newAd.set({...newAd(), mediaUrl: ''})" title="Remove">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    </div>
                    <div class="preview-frame-premium">
                      <img *ngIf="newAd().adType === 'image'" [src]="newAd().mediaUrl" alt="Ad Preview" class="preview-media-full">
                      <video *ngIf="newAd().adType === 'video'" [src]="newAd().mediaUrl" controls class="preview-media-full"></video>
                      <div *ngIf="newAd().adType === 'text'" class="text-preview-premium">
                        <h4>{{ newAd().title || 'Campaign Title' }}</h4>
                        <p>Your sponsored content preview will appear here.</p>
                      </div>
                    </div>
                  </div>
                  
                  <input #fileInput type="file" (change)="onFileSelected($event)" style="display: none">
                </div>
              </div>

              <div class="row">
                <app-floating-input 
                  label="Target Redirect URL"
                  [ngModel]="newAd().targetUrl"
                  (ngModelChange)="newAd.set({...newAd(), targetUrl: $event})"
                  placeholder="https://yourwebsite.com/offer">
                </app-floating-input>
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
    .publisher-ads-container { 
      padding: 0; 
      min-height: 100vh; 
      background: #f8fafc; 
      overflow-x: hidden;
      scrollbar-width: none; 
      -ms-overflow-style: none; 
    }
    .publisher-ads-container::-webkit-scrollbar { display: none; }
    
    /* Stats Row Refined */
    .ads-stats-grid { 
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; 
      padding: 1rem 2rem 0; max-width: 1600px; margin: 0 auto; 
    }
    .stat-mini { 
      background: #fff; padding: 1.5rem; border-radius: 10px; 
      border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.5rem;
      transition: transform 0.2s;
    }
    .stat-mini:hover { transform: translateY(-3px); }
    .stat-mini .label { font-size: 0.7rem; font-weight: 800; color: #94a3b8; letter-spacing: 1px; text-transform: uppercase; }
    .stat-mini .value { font-size: 1.5rem; font-weight: 900; color: #0f172a; }
    .stat-mini.highlight .value { color: #f59e0b; }

    /* Controls Row */
    .controls-row-wrapper {
      display: grid; grid-template-columns: 1fr auto; gap: 1.5rem;
      padding: 1rem 2rem; max-width: 1600px; margin: 0 auto; width: 100%; box-sizing: border-box;
      align-items: center;
    }
    .search-refined {
      position: relative; display: flex; align-items: center; width: 100%;
    }
    .search-refined svg { position: absolute; left: 1.5rem; color: #94a3b8; transition: all 0.3s; z-index: 2; }
    .search-refined input {
      width: 100%; padding: 1.1rem 1.5rem 1.1rem 4rem;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      font-size: 1rem; font-weight: 600; color: #0f172a; outline: none; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .search-refined input::placeholder { color: #94a3b8; font-weight: 500; }
    .search-refined input:focus { 
      background: #fff; border-color: #0f172a; 
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    }
    .search-refined input:focus + svg { color: #0f172a; }
    
    .btn-create-premium {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      padding: 0.9rem 2.25rem; background: #0f172a; color: #fff; border: none;
      border-radius: 10px; font-weight: 800; font-size: 0.95rem; cursor: pointer;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
      box-shadow: 0 10px 20px -5px rgba(15, 23, 42, 0.3);
      position: relative; overflow: hidden;
    }
    .btn-create-premium::after {
      content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
      transform: rotate(45deg); transition: 0.8s; opacity: 0;
    }
    .btn-create-premium:hover { 
      background: #1e293b; transform: translateY(-3px) scale(1.02); 
      box-shadow: 0 20px 30px -10px rgba(15, 23, 42, 0.4);
    }
    .btn-create-premium:hover::after { opacity: 1; left: 100%; transition: 0.6s; }
    .btn-create-premium:active { transform: translateY(-1px); }
    
    .btn-icon-box { 
      width: 28px; height: 28px; background: rgba(255,255,255,0.15); 
      border-radius: 8px; display: flex; align-items: center; justify-content: center; 
      transition: all 0.3s;
    }
    .btn-create-premium:hover .btn-icon-box { background: rgba(255,255,255,0.25); transform: rotate(90deg); }

    /* Inventory Section */
    .inventory-section { padding: 0 2rem 4rem; max-width: 1600px; margin: 0 auto; }
    .inventory-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .label-group { display: flex; align-items: center; gap: 1rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin: 0; }
    .count-chip { background: #f1f5f9; color: #64748b; padding: 4px 12px; border-radius: 100px; font-size: 0.75rem; font-weight: 700; }
    .select-refined {
      background: #fff; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem;
      border-radius: 10px; font-weight: 700; font-size: 0.85rem; color: #475569; outline: none; cursor: pointer;
    }

    /* Custom Select Styles */
    .custom-select-wrapper {
      position: relative;
      min-width: 220px;
    }

    .custom-select-trigger {
      background: #fff;
      border: 1px solid #e2e8f0;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.85rem;
      color: #0f172a;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: all 0.3s;
      user-select: none;
    }

    .custom-select-trigger:hover {
      border-color: #0f172a;
      background: #f8fafc;
    }

    .custom-select-trigger.active {
      border-color: #0f172a;
      box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.05);
    }

    .custom-select-trigger .chevron {
      transition: transform 0.3s;
      color: #94a3b8;
    }

    .custom-select-trigger.active .chevron {
      transform: rotate(180deg);
      color: #0f172a;
    }

    .custom-options-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 100%;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      z-index: 100;
      padding: 6px;
      overflow: hidden;
    }

    .custom-option {
      padding: 0.75rem 1rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: all 0.2s;
    }

    .custom-option:hover {
      background: #f1f5f9;
      color: #0f172a;
    }

    .custom-option.selected {
      background: rgba(15, 23, 42, 0.05);
      color: #0f172a;
    }

    /* Table Grid Premium */
    .campaign-list-wrapper { 
      background: #fff; 
      border-radius: 16px; 
      border: 1px solid #e2e8f0; 
      box-shadow: 
        0 4px 6px -1px rgba(0,0,0,0.02),
        0 10px 15px -3px rgba(0,0,0,0.03); 
      overflow: hidden; 
    }

    .inventory-grid-header {
      display: grid; 
      grid-template-columns: 2.2fr 80px 110px 110px 140px 90px 130px;
      padding: 1rem 1.5rem; 
      background: #f8fafc; 
      border-bottom: 1px solid #eee; 
      gap: 1rem; 
      align-items: center;
    }

    .inventory-grid-header span { 
      font-size: 0.65rem; 
      font-weight: 900; 
      color: #64748b; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
    }

    .inventory-item-row {
      display: grid; 
      grid-template-columns: 2.2fr 80px 110px 110px 140px 90px 130px;
      padding: 1.25rem 1.5rem; 
      border-bottom: 1px solid #f8fafc; 
      gap: 1rem; 
      align-items: center; 
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
      background: #fff;
    }

    .inventory-item-row:hover { 
      background: #fdfdfd; 
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -5px rgba(0,0,0,0.05);
      border-bottom-color: transparent;
      z-index: 10;
    }

    .inventory-item-row::before {
      content: '';
      position: absolute;
      left: 0;
      top: 15%;
      height: 70%;
      width: 4px;
      background: #6366f1;
      border-radius: 0 4px 4px 0;
      opacity: 0;
      transition: all 0.3s;
    }

    .inventory-item-row:hover::before { opacity: 1; left: 0; }

    .inventory-item-row:last-child { border-bottom: none; }

    .creative-cell { display: flex; align-items: center; gap: 1rem; min-width: 0; }

    .creative-preview-box { 
      width: 48px; height: 48px; border-radius: 12px; 
      background-size: cover; background-position: center; 
      flex-shrink: 0; border: 1px solid #e2e8f0; 
      box-shadow: 0 4px 8px rgba(0,0,0,0.04); 
      transition: transform 0.3s;
    }
    
    .inventory-item-row:hover .creative-preview-box { transform: scale(1.05); border-color: #6366f1; }

    .no-asset { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #94a3b8; }
    
    .creative-meta { display: flex; flex-direction: column; min-width: 0; gap: 2px; }
    .creative-title { font-weight: 800; color: #0f172a; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .creative-url { font-size: 0.75rem; color: #94a3b8; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .pill-type { padding: 4px 10px; border-radius: 100px; font-size: 0.6rem; font-weight: 800; }
    .pill-type.image { background: #fee2e2; color: #ef4444; }
    .pill-type.video { background: #e0e7ff; color: #4f46e5; }
    .pill-type.text { background: #dcfce7; color: #059669; }

    .audience-label { font-size: 0.85rem; font-weight: 700; color: #1e293b; }
    .date-label { font-size: 0.8rem; font-weight: 600; color: #64748b; }

    .performance-visual { display: flex; align-items: center; gap: 1rem; }
    .stat-mini-table { display: flex; flex-direction: column; }
    .stat-mini-table .val { font-size: 1rem; font-weight: 800; color: #0f172a; line-height: 1; letter-spacing: -0.02em; }
    .stat-mini-table .unit { font-size: 0.55rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
    .stat-mini-table.highlight .val { color: #f59e0b; }
    .stat-divider { width: 1px; height: 20px; background: #f1f5f9; }

    .status-badge-refined { 
      padding: 5px 12px; border-radius: 100px; font-size: 0.65rem; font-weight: 800; 
      text-transform: uppercase; display: inline-block; letter-spacing: 0.05em;
    }
    .status-badge-refined.pending { background: #fffbeb; color: #d97706; border: 1px solid #fef3c7; }
    .status-badge-refined.approved { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
    .status-badge-refined.active { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
    .status-badge-refined.rejected { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
    .status-sub-label { font-size: 0.6rem; font-weight: 800; color: #94a3b8; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }

    .action-set { display: flex; justify-content: flex-end; gap: 0.5rem; }
    .icon-btn-refined { 
      width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; 
      background: #fafafa; border: 1px solid #f0f0f0; border-radius: 10px; cursor: pointer; color: #64748b; transition: all 0.2s;
    }
    .icon-btn-refined:hover { background: #fff; color: #0f172a; border-color: #6366f1; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.04); }
    .icon-btn-refined.toggle.is-active { color: #f59e0b; border-color: #fbbf24; background: #fffbeb; }
    .icon-btn-refined.danger:hover { background: #fef2f2; color: #ef4444; border-color: #fecaca; }

    /* Empty State */
    .premium-empty-state { padding: 6rem 2rem; text-align: center; }
    .empty-icon-box { width: 64px; height: 64px; background: #f1f5f9; color: #94a3b8; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .premium-empty-state h3 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .premium-empty-state p { color: #64748b; font-size: 0.9rem; max-width: 320px; margin: 0 auto; line-height: 1.5; }

    /* Modal Mirrored Styles */
    .modal-overlay-new {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(20px) saturate(180%);
      display: flex; align-items: flex-start; justify-content: center; padding: 1rem 2rem;
    }
    .modal-wrapper {
      background: #fff; width: 100%; max-width: 800px; max-height: 90vh;
      border-radius: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2);
      display: flex; flex-direction: column; overflow: hidden;
    }
    .modal-top {
      padding: 1rem 2.5rem; display: flex; justify-content: space-between;
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
    .modal-content-new { 
      padding: 1.5rem 2.5rem; 
      overflow-y: auto; 
      flex: 1; 
      scrollbar-width: none; 
      -ms-overflow-style: none; 
    }
    .modal-content-new::-webkit-scrollbar { display: none; }
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

    /* Media Preview Premium */
    .media-preview-premium {
      margin-top: 1.5rem; background: #f8fafc; border: 1px solid #e2e8f0;
      border-radius: 10px; padding: 1.25rem; overflow: hidden;
    }
    .preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .preview-label { font-size: 0.65rem; font-weight: 800; color: #94a3b8; letter-spacing: 1px; }
    .btn-remove-asset { background: none; border: none; font-size: 1.25rem; color: #94a3b8; cursor: pointer; transition: color 0.2s; padding: 0 5px; }
    .btn-remove-asset:hover { color: #ef4444; }
    .preview-frame { width: 100%; border-radius: 12px; overflow: hidden; background: #fff; border: 1px solid #f1f5f9; min-height: 100px; display: flex; align-items: center; justify-content: center; }
    .preview-media { width: 100%; max-height: 300px; object-fit: contain; display: block; }
    .text-preview-box { padding: 2rem; text-align: center; }
    .text-preview-box p { font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; }
    .text-preview-box small { color: #64748b; font-size: 0.75rem; font-style: italic; }

    /* New Premium Upload Zone */
    .upload-zone-premium {
      border: 2px dashed #e2e8f0; background: #f8fafc; border-radius: 24px; padding: 3rem 2rem;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.25rem;
      cursor: pointer; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); text-align: center;
    }
    .upload-zone-premium:hover { border-color: #0f172a; background: #fff; transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05); }
    
    .upload-icon-box { width: 64px; height: 64px; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94a3b8; transition: all 0.3s; }
    .upload-zone-premium:hover .upload-icon-box { color: #0f172a; border-color: #0f172a; transform: scale(1.05); }
    
    .upload-text-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .upload-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
    .upload-subtitle { font-size: 0.85rem; font-weight: 500; color: #94a3b8; }
    
    .loader-premium { width: 32px; height: 32px; border: 3px solid rgba(15, 23, 42, 0.1); border-top-color: #0f172a; border-radius: 50%; animation: mini-spin 0.8s linear infinite; }
    .upload-icon-box.syncing { border-color: transparent; background: transparent; }

    /* Refined Preview Section */
    .media-preview-premium { border-radius: 24px; background: #fff; border: 1px solid #e2e8f0; padding: 1.5rem; }
    .preview-meta-info { display: flex; align-items: center; gap: 0.75rem; }
    .asset-type-badge { background: #0f172a; color: #fff; padding: 2px 8px; border-radius: 6px; font-size: 0.6rem; font-weight: 800; }
    .preview-actions { display: flex; align-items: center; gap: 0.5rem; }
    .btn-action-small { display: flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700; color: #475569; cursor: pointer; transition: all 0.2s; }
    .btn-action-small:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
    .btn-remove-asset-premium { width: 28px; height: 28px; border-radius: 8px; border: 1px solid #fee2e2; background: #fff5f5; color: #ef4444; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
    .btn-remove-asset-premium:hover { background: #ef4444; color: #fff; }
    .preview-frame-premium { width: 100%; border-radius: 16px; overflow: hidden; margin-top: 1.25rem; background: #f8fafc; border: 1px solid #f1f5f9; }
    .preview-media-full { width: 100%; max-height: 400px; object-fit: contain; display: block; }
    .text-preview-premium { padding: 3rem 2rem; text-align: center; }
    .text-preview-premium h4 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .text-preview-premium p { color: #64748b; font-size: 0.9rem; }

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

    /* Floating Component Customization for Light Theme */
    .light-select {
      --fs-bg: #ffffff;
      --fs-text: #1e293b;
      --fs-border: #eee;
      --fs-label: #64748b;
      --fs-primary: #000000;
    }
    .light-select {
      --fs-bg: #ffffff;
      --fs-text: #334155;
      --fs-border: #e2e8f0;
      --fs-label: #64748b;
      --fs-primary: #0f172a;
    }
  `]
})
export class PublisherAdsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private uiService = inject(UiService);

  ads = signal<any[]>([]);
  searchQuery = signal('');
  filterType = signal('all');
  isFilterOpen = signal(false);

  constructor(private eRef: ElementRef) {
    effect(() => {
      // Re-fetch whenever filter or search query changes
      // This implements the "one click -> API call" requirement
      this.searchQuery();
      this.filterType();
      
      // We wrap it in a small timeout to allow for search debouncing later if needed
      // but for now, the reactive trigger ensures the UI is always in sync with the backend
      this.loadAds();
    });
  }

  @HostListener('document:click', ['$event'])
  clickout(event: any) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isFilterOpen.set(false);
    }
  }

  filterOptions = [
    { value: 'all', label: 'All Channels' },
    { value: 'image', label: 'Image Display' },
    { value: 'video', label: 'Video Shorts' },
    { value: 'text', label: 'Sponsored Content' }
  ];

  filterTypeLabel = computed(() => {
    const type = this.filterType();
    return this.filterOptions.find(o => o.value === type)?.label || 'All Channels';
  });
  isCreatingAd = signal(false);
  editingAdId = signal<string | null>(null);
  isUploadingAdAsset = signal(false);

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

  filteredAds = computed(() => {
    // The backend now handles the heavy lifting of filtering.
    // We simply return the latest data from our ads signal.
    return this.ads();
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
    // Initial fetch and subsequent updates are now handled by the reactive effect in the constructor
  }

  loadAds() {
    let params = new HttpParams();
    
    const type = this.filterType();
    if (type && type !== 'all') {
      params = params.set('type', type);
    }

    const query = this.searchQuery();
    if (query) {
      params = params.set('search', query);
    }

    this.http.get<any[]>('http://localhost:3000/publisher/ads', { params }).subscribe({
      next: (res) => {
        this.ads.set(res);
        this.calculateStats(res);
      },
      error: (err) => {
        console.error('Failed to load ads:', err);
        this.toast.show('Failed to synchronize with backend', 'error');
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
    this.uiService.isModalOpen.set(true);
  }

  closeAdModal() {
    this.isCreatingAd.set(false);
    this.editingAdId.set(null);
    this.uiService.isModalOpen.set(false);
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
        this.uiService.isModalOpen.set(false);
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
      // Auto-detect ad type from file
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
