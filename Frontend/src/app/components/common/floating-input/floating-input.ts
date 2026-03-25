import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-floating-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FloatingInputComponent),
      multi: true
    }
  ],
  templateUrl: './floating-input.html',
  styleUrl: './floating-input.css'
})
export class FloatingInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() id = '';
  @Input() name = '';
  @Input() autocomplete = 'off';
  @Input() required = false;
  @Input() maxlength: number | null = null;
  @Input() customStyle: { [key: string]: any } = {};
  @Input() isInvalid = false;

  value = '';
  isFocused = signal(false);

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

  onInputChange(event: any) {
    this.value = event;
    this.onChange(event);
  }

  onFocus() {
    this.isFocused.set(true);
  }

  onBlur() {
    this.isFocused.set(false);
    this.onTouched();
  }
}
