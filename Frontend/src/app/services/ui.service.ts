import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  isModalOpen = signal(false);

  setModalState(isOpen: boolean) {
    this.isModalOpen.set(isOpen);
  }
}
