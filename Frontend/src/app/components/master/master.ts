import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MasterService } from '../../services/master.service';

@Component({
  selector: 'app-master',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './master.html',
  styleUrl: './master.scss'
})
export class MasterComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private masterService = inject(MasterService);
  activeSubTab = signal<string>('countries');

  countries = signal<any[]>([]);
  cities = signal<any[]>([]);

  isModalOpen = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  
  // Form Signals
  formData = signal<any>({
    name: '',
    isoCode: '',
    mobileCode: '',
    currency: '',
    country: ''
  });

  editingId = signal<string | null>(null);

  ngOnInit() {
    this.route.queryParams.subscribe((params: any) => {
      const tab = params['tab'];
      if (tab) this.activeSubTab.set(tab);
      this.loadData();
    });
  }

  loadData() {
    if (this.activeSubTab() === 'countries') {
      this.masterService.getCountries().subscribe((data: any[]) => this.countries.set(data));
    } else {
      this.masterService.getCities().subscribe((data: any[]) => this.cities.set(data));
      // Also fetch countries for the dropdown
      this.masterService.getCountries().subscribe((data: any[]) => this.countries.set(data));
    }
  }

  switchTab(tab: string) {
    this.activeSubTab.set(tab);
    this.loadData();
  }

  add() {
    this.modalMode.set('add');
    this.editingId.set(null);
    this.formData.set({
      name: '',
      isoCode: '',
      mobileCode: '',
      currency: '',
      country: ''
    });
    this.isModalOpen.set(true);
    document.body.classList.add('modal-open');
  }

  edit(item: any) {
    this.modalMode.set('edit');
    this.editingId.set(item.id);
    
    // Prepare form data, extracting country name for city dropdown if needed
    const data = { ...item };
    if (this.activeSubTab() === 'cities' && item.country) {
      data.country = item.country.name;
    }
    
    this.formData.set(data);
    this.isModalOpen.set(true);
    document.body.classList.add('modal-open');
  }

  closeModal() {
    this.isModalOpen.set(false);
    document.body.classList.remove('modal-open');
  }

  save() {
    const data = this.formData();
    const subTab = this.activeSubTab();
    const mode = this.modalMode();
    const id = this.editingId();

    if (subTab === 'countries') {
      const action = mode === 'add' 
        ? this.masterService.addCountry(data) 
        : this.masterService.updateCountry(id!, data);
      
      action.subscribe(() => {
        this.loadData();
        this.closeModal();
      });
    } else {
      const action = mode === 'add' 
        ? this.masterService.addCity(data) 
        : this.masterService.updateCity(id!, data);
      
      action.subscribe(() => {
        this.loadData();
        this.closeModal();
      });
    }
  }

  delete(item: any) {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      const subTab = this.activeSubTab();
      const action = subTab === 'countries' 
        ? this.masterService.deleteCountry(item.id) 
        : this.masterService.deleteCity(item.id);

      action.subscribe(() => this.loadData());
    }
  }
}
