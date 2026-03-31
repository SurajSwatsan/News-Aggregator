import { Component, Input, forwardRef, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-floating-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FloatingSelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="floating-group" 
         [class.focused]="isOpen()" 
         [class.has-value]="value" 
         [class.is-invalid]="isInvalid"
         (clickOutside)="closeDropdown()">
      <div class="input-container" (click)="toggleDropdown()">
        <div class="icon-wrapper">
          <ng-content select="[icon]"></ng-content>
        </div>
        
        <div class="selected-value">
          {{ getDisplayLabel() }}
        </div>
        
        <label class="floating-label">{{ label }}</label>
        
        <div class="select-arrow" [class.rotated]="isOpen()">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </div>
      </div>

      <!-- Custom Dropdown Menu -->
      <div class="dropdown-menu" *ngIf="isOpen()" (click)="$event.stopPropagation()">
        <div class="options-container">
          <div class="option-item" 
               *ngFor="let option of options" 
               [class.selected]="option.value === value"
               (click)="selectOption(option)">
            {{ option.label }}
            <svg *ngIf="option.value === value" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="no-options" *ngIf="options.length === 0">
            No items available
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      --fs-primary: #8b5cf6;
      --fs-bg: #111827;
      --fs-border: rgba(255, 255, 255, 0.1);
      --fs-text: #f8fafc;
      --fs-label: #94a3b8;
    }

    .floating-group {
      position: relative;
      width: 100%;
      margin-top: 10px;
    }

    .input-container {
      position: relative;
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1.5px solid var(--fs-border);
      border-radius: 14px;
      padding: 0 1.25rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 60px;
      cursor: pointer;
      user-select: none;
    }

    .input-container:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.2);
    }

    .selected-value {
      flex: 1;
      color: var(--fs-text);
      font-size: 1rem;
      font-weight: 500;
      padding: 1rem 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .floating-label {
      position: absolute;
      left: 1.25rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--fs-label);
      font-size: 1rem;
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      padding: 0 4px;
      z-index: 10;
    }

    .focused .floating-label,
    .has-value .floating-label {
      top: 0;
      left: 12px;
      transform: translateY(-50%) scale(0.85);
      background: var(--fs-bg);
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--fs-primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .focused .input-container {
      border-color: var(--fs-primary);
      box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
      background: rgba(139, 92, 246, 0.03);
    }

    .select-arrow {
      color: var(--fs-label);
      transition: transform 0.3s ease;
      display: flex;
      align-items: center;
    }

    .select-arrow.rotated {
      transform: rotate(180deg);
      color: var(--fs-primary);
    }

    /* Dropdown Menu Styling */
    .dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      right: 0;
      background: #1f2937;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
      z-index: 1000;
      overflow: hidden;
      animation: slideIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(12px);
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .options-container {
      max-height: 250px;
      overflow-y: auto;
      padding: 6px;
    }

    .option-item {
      padding: 12px 1rem;
      color: #94a3b8;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.95rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .option-item:hover {
      background: rgba(255, 255, 255, 0.06);
      color: white;
    }

    .option-item.selected {
      background: rgba(139, 92, 246, 0.1);
      color: var(--fs-primary);
    }

    .no-options {
      padding: 1rem;
      text-align: center;
      color: #64748b;
      font-size: 0.875rem;
    }

    .is-invalid .input-container {
      border-color: #ef4444 !important;
    }
  `],
})
export class FloatingSelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() options: { value: any, label: string }[] = [];
  @Input() isInvalid = false;
  
  @Output() selectionChange = new EventEmitter<any>();

  value: any = '';
  isOpen = signal(false);

  // Boilerplate for ControlValueAccessor
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.value = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  // Logic
  toggleDropdown() {
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.onTouched();
    }
  }

  closeDropdown() {
    this.isOpen.set(false);
  }

  selectOption(option: any) {
    this.value = option.value;
    this.onChange(this.value);
    this.selectionChange.emit(this.value);
    this.isOpen.set(false);
  }

  getDisplayLabel(): string {
    const selected = this.options.find(o => o.value === this.value);
    return selected ? selected.label : '';
  }

  // Handle global clicks to close dropdown
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = (event.target as HTMLElement).closest('.floating-group');
    if (!clickedInside) {
      this.closeDropdown();
    }
  }
}

import { HostListener } from '@angular/core';
