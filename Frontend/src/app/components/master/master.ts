import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MasterService } from '../../services/master.service';
import { UiService } from '../../services/ui.service';
import { FloatingInputComponent } from '../common/floating-input/floating-input';
import { FloatingSelectComponent } from '../common/floating-select/floating-select';

@Component({
  selector: 'app-master',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FloatingInputComponent, FloatingSelectComponent],
  templateUrl: './master.html',
  styleUrl: './master.scss'
})
export class MasterComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private masterService = inject(MasterService);
  private uiService = inject(UiService);
  activeSubTab = signal<string>('countries');

  countries = signal<any[]>([]);
  states = signal<any[]>([]);
  modalStates = signal<any[]>([]);
  cities = signal<any[]>([]);

  isModalOpen = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  isFormTouched = signal(false);
  
  // Form Signals
  formData = signal<any>({
    name: '',
    isoCode: '',
    mobileCode: '',
    currency: '',
    currencySymbol: '',
    country: '',
    state: ''
  });

  editingId = signal<string | null>(null);

  countryOptions = computed(() => 
    this.countries().map(c => ({ value: c.name, label: c.name }))
  );

  stateOptions = computed(() => {
    return this.modalStates().map(s => ({ value: s.name, label: s.name }));
  });

  isFormValid = computed(() => {
    const data = this.formData();
    const tab = this.activeSubTab();
    if (tab === 'countries') {
      return !!(data.name?.trim() && data.isoCode?.trim() && data.currency?.trim() && data.currencySymbol?.trim());
    } else if (tab === 'states') {
      return !!(data.name?.trim() && data.country);
    } else {
      return !!(data.name?.trim() && data.country); // State is optional for city
    }
  });

  ngOnInit() {
    this.route.queryParams.subscribe((params: any) => {
      const tab = params['tab'];
      if (tab) this.activeSubTab.set(tab);
      this.loadData();
    });
  }

  loadData() {
    const tab = this.activeSubTab();
    if (tab === 'countries') {
      this.masterService.getCountries().subscribe((data: any[]) => this.countries.set(data));
    } else if (tab === 'states') {
      this.masterService.getStates().subscribe((data: any[]) => this.states.set(data));
      this.masterService.getCountries().subscribe((data: any[]) => this.countries.set(data));
    } else {
      this.masterService.getCities().subscribe((data: any[]) => this.cities.set(data));
      this.masterService.getCountries().subscribe((data: any[]) => this.countries.set(data));
      this.masterService.getStates().subscribe((data: any[]) => this.states.set(data));
    }
  }

  switchTab(tab: string) {
    this.activeSubTab.set(tab);
    this.loadData();
  }

  add() {
    this.modalMode.set('add');
    this.editingId.set(null);
    this.isFormTouched.set(false);
    this.modalStates.set([]); // Clear modal states for new entry
    this.formData.set({
      name: '',
      isoCode: '',
      mobileCode: '',
      currency: '',
      currencySymbol: '',
      country: '',
      state: ''
    });
    this.isModalOpen.set(true);
    this.uiService.setModalState(true);
    document.body.classList.add('modal-open');
  }

  onCountryChange(countryName: string) {
    this.formData.set({ ...this.formData(), country: countryName, state: '' });
    this.modalStates.set([]);
    
    if (countryName) {
      const country = this.countries().find(c => c.name === countryName);
      if (country) {
        this.masterService.getStates(country.id).subscribe((data: any[]) => {
          this.modalStates.set(data);
        });
      }
    }
  }

  edit(item: any) {
    this.modalMode.set('edit');
    this.editingId.set(item.id);
    this.isFormTouched.set(false);
    this.modalStates.set([]);
    
    // Prepare form data, extracting country name for city dropdown if needed
    const data = { ...item };
    if ((this.activeSubTab() === 'cities' || this.activeSubTab() === 'states') && item.country) {
      data.country = item.country.name;
      
      // Fetch states for this country immediately so dropdown is ready
      this.masterService.getStates(item.country.id).subscribe((data: any[]) => {
        this.modalStates.set(data);
      });
    }
    if (this.activeSubTab() === 'cities' && item.state) {
      data.state = item.state.name;
    }
    
    this.formData.set(data);
    this.isModalOpen.set(true);
    this.uiService.setModalState(true);
    document.body.classList.add('modal-open');
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.uiService.setModalState(false);
    document.body.classList.remove('modal-open');
  }

  save() {
    this.isFormTouched.set(true);
    if (!this.isFormValid()) return;
    
    const data = this.formData();
    const subTab = this.activeSubTab();
    const mode = this.modalMode();
    const id = this.editingId();

    if (subTab === 'countries') {
      const action = mode === 'add' 
        ? this.masterService.addCountry(data) 
        : this.masterService.updateCountry(id!, data);
      
      action.subscribe(() => { this.loadData(); this.closeModal(); });
    } else if (subTab === 'states') {
      const action = mode === 'add' 
        ? this.masterService.addState(data) 
        : this.masterService.updateState(id!, data);
      
      action.subscribe(() => { this.loadData(); this.closeModal(); });
    } else {
      const action = mode === 'add' 
        ? this.masterService.addCity(data) 
        : this.masterService.updateCity(id!, data);
      
      action.subscribe(() => { this.loadData(); this.closeModal(); });
    }
  }

  delete(item: any) {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      const subTab = this.activeSubTab();
      const action = subTab === 'countries' 
        ? this.masterService.deleteCountry(item.id) 
        : subTab === 'states'
          ? this.masterService.deleteState(item.id)
          : this.masterService.deleteCity(item.id);

      action.subscribe(() => this.loadData());
    }
  }
}
