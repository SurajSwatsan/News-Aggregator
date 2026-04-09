import { Component, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from '../../services/notification.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'notification-bell.html',
  styleUrls: ['notification-bell.scss']
})
export class NotificationBellComponent {
  public notificationService = inject(NotificationService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  isOpen = signal(false);

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isOpen.set(!this.isOpen());
    if (this.isOpen()) {
      this.notificationService.fetchNotifications();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  handleNotificationClick(n: Notification) {
    if (!n.isRead) {
      this.notificationService.markAsRead(n.id);
    }
    this.isOpen.set(false);
    // Optional: Redirect based on notification type
    if (n.type === 'PAYMENT_SUCCESS') {
      this.router.navigate(['/profile']);
    }
  }

  formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }
}
