import { Injectable, signal } from '@angular/core';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 1;

  show(message: string, type: 'success' | 'error' | 'info' = 'success', duration: number = 4000) {
    const id = this.nextId++;
    const toast: Toast = { message, type, id };
    this.toasts.update(t => [...t, toast]);

    setTimeout(() => {
      this.remove(id);
    }, duration);
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
