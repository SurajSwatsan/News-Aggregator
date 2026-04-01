import { Component, OnInit, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './admin-subscription.html',
  styleUrl: './admin-subscription.scss'
})
export class AdminSubscriptionComponent implements OnInit {
  private http = inject(HttpClient);
  @Output() modalState = new EventEmitter<boolean>(); // Global sidebar sync
  
  readers = signal<any[]>([]);
  plans = signal<any[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  activeView = signal<'plans' | 'readers'>('plans');

  // Currency Options
  currencies = ['INR (₹)', 'USD ($)', 'EUR (€)', 'GBP (£)'];
  
  // Plan Name Options
  planNames = ['Basic Edition', 'Professional Tier', 'Elite Premium'];

  // Plan Statistics
  public basicCount = computed(() => this.readers().filter(r => this.getPlanType(r.creditBalance) === 'BASIC').length);
  public proCount = computed(() => this.readers().filter(r => this.getPlanType(r.creditBalance) === 'PRO').length);
  public eliteCount = computed(() => this.readers().filter(r => this.getPlanType(r.creditBalance) === 'ELITE').length);
  
  // Filtering
  filteredReaders = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const all = this.readers();
    if (!q) return all;
    return all.filter(r => 
      r.email?.toLowerCase().includes(q) || 
      r.username?.toLowerCase().includes(q) ||
      r.name?.toLowerCase().includes(q)
    );
  });

  // Add Plan Modal State
  showAddPlanModal = signal(false);
  showFreqDropdown = signal(false);
  openDropdownId = signal<string | null>(null);

  newPlan = signal<any>({
    uuid: '',
    billingCycle: 'Subscription',
    isActive: true,
    createdBy: 'Admin_Master',
    subscriptions: {
      monthly: { enabled: true, name: '', price: null, credits: null, currency: '', features: [] },
      quarterly: { enabled: false, name: '', price: null, credits: null, currency: '', features: [] },
      yearly: { enabled: false, name: '', price: null, credits: null, currency: '', features: [] }
    }
  });

  // Computed label for the multi-select dropdown
  selectedFreqLabel = computed(() => {
    const subs = this.newPlan().subscriptions;
    const selected = Object.keys(subs).filter(k => subs[k].enabled);
    if (selected.length === 0) return 'Choose Frequencies';
    return selected.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
  });

  ngOnInit() {
    this.fetchReaders();
    this.fetchPlans();
  }

  fetchReaders() {
    this.isLoading.set(true);
    this.http.get<any>('http://localhost:3000/auth/users?role=reader&limit=100').subscribe({
      next: (res) => {
        this.readers.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  fetchPlans() {
    this.http.get<any[]>('http://localhost:3000/subscription-plans').subscribe({
      next: (data) => this.plans.set(data),
      error: (err) => console.error('Failed to fetch plans', err)
    });
  }

  deletePlan(id: string) {
    if (confirm('Are you sure you want to delete this subscription tier? This will affect all readers on this plan.')) {
      this.http.delete(`http://localhost:3000/subscription-plans/${id}`).subscribe(() => {
        this.fetchPlans();
      });
    }
  }

  togglePlanStatus(plan: any) {
    const newStatus = !plan.isActive;
    this.http.patch(`http://localhost:3000/subscription-plans/${plan.id}`, { isActive: newStatus }).subscribe(() => {
      this.fetchPlans();
    });
  }

  getPlanType(credits: number): string {
    if (credits >= 5000) return 'ELITE';
    if (credits >= 100) return 'PRO';
    if (credits >= 50) return 'BASIC';
    return 'FREE';
  }

  getPlanClass(credits: number): string {
    const plan = this.getPlanType(credits).toLowerCase();
    return `plan-badge ${plan}`;
  }
  
  addBonusCredits(userId: string) {
    if (confirm('Add 50 bonus credits to this user?')) {
      this.http.post(`http://localhost:3000/auth/add-credits`, { userId, amount: 50 }).subscribe(() => {
        this.fetchReaders();
      });
    }
  }

  // --- Add Plan Logic ---
  openAddPlanModal() {
    this.newPlan.set({
      uuid: crypto.randomUUID(),
      billingCycle: 'Subscription',
      isActive: true,
      createdBy: 'Admin_Master',
      subscriptions: {
        monthly: { enabled: true, name: '', price: null, credits: null, currency: '', features: [] },
        quarterly: { enabled: false, name: '', price: null, credits: null, currency: '', features: [] },
        yearly: { enabled: false, name: '', price: null, credits: null, currency: '', features: [] }
      }
    });
    this.showFreqDropdown.set(false);
    this.openDropdownId.set(null);
    this.showAddPlanModal.set(true);
    this.modalState.emit(true);
  }

  toggleDropdown(id: string) {
    this.openDropdownId.set(this.openDropdownId() === id ? null : id);
  }

  selectValue(freq: string, field: 'name' | 'currency', value: string) {
    this.newPlan.update(plan => ({
      ...plan,
      subscriptions: {
        ...plan.subscriptions,
        [freq]: {
          ...plan.subscriptions[freq],
          [field]: value
        }
      }
    }));
    this.openDropdownId.set(null);
  }

  switchView(view: 'plans' | 'readers') {
    this.activeView.set(view);
  }

  toggleFrequency(freq: string) {
    this.newPlan.update(plan => {
      const isEnabling = !plan.subscriptions[freq].enabled;
      const currentFeatures = plan.subscriptions[freq].features;
      
      // Auto-initialize one feature row if enabling and currently empty
      const updatedFeatures = (isEnabling && currentFeatures.length === 0) 
        ? [''] 
        : currentFeatures;

      return {
        ...plan,
        subscriptions: {
          ...plan.subscriptions,
          [freq]: {
            ...plan.subscriptions[freq],
            enabled: isEnabling,
            features: updatedFeatures
          }
        }
      };
    });
  }

  addFrequencyFeature(freq: string) {
    this.newPlan.update(plan => ({
      ...plan,
      subscriptions: {
        ...plan.subscriptions,
        [freq]: {
          ...plan.subscriptions[freq],
          features: [...plan.subscriptions[freq].features, '']
        }
      }
    }));
  }


  removeFrequencyFeature(freq: string, index: number) {
    this.newPlan.update(plan => {
      const updatedFeatures = plan.subscriptions[freq].features.filter((_: any, i: number) => i !== index);
      return {
        ...plan,
        subscriptions: {
          ...plan.subscriptions,
          [freq]: {
            ...plan.subscriptions[freq],
            features: updatedFeatures.length > 0 ? updatedFeatures : ['']
          }
        }
      };
    });
  }

  closeModal() {
    this.showAddPlanModal.set(false);
    this.modalState.emit(false);
  }

  savePlan() {
    const plan = this.newPlan();
    
    if (!plan.billingCycle) {
      alert('Selection Required: Please choose a Billing Model (One-Time or Subscription) before saving.');
      return;
    }
    
    const activeSubs = Object.entries(plan.subscriptions)
      .filter(([_, data]: [string, any]) => data.enabled)
      .map(([freq, data]: [string, any]) => ({
        frequency: freq,
        name: data.name, // Using frequency-specific name
        price: data.price,
        credits: data.credits,
        currency: data.currency,
        features: data.features.filter((f: string) => !!f.trim())
      }));

    if (activeSubs.length === 0) {
      alert('Validation Error: Please enable at least one billing frequency (Monthly, Quarterly, or Yearly).');
      return;
    }

    let finalData: any = {
      uuid: plan.uuid,
      name: activeSubs[0].name, // Using the first sub's name as a primary name for the collection
      billingCycle: plan.billingCycle,
      isActive: plan.isActive,
      createdBy: plan.createdBy,
      subscriptions: activeSubs
    };

    console.log('Sending to Backend:', finalData);
    
    this.http.post('http://localhost:3000/subscription-plans', finalData).subscribe({
      next: () => {
        alert('Plan successfully created and stored in the database!');
        this.fetchPlans();
        this.closeModal();
      },
      error: (err) => {
        console.error('Save failed:', err);
        alert('Failed to save plan. Please check if the backend is running.');
      }
    });
  }

  trackByIndex(index: number): number {
    return index;
  }
}
