import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth';
import { timer, switchMap, catchError, of, filter } from 'rxjs';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private baseUrl = 'http://localhost:3000/notifications';

  notifications = signal<Notification[]>([]);
  unreadCount = signal<number>(0);

  constructor() {
    // Polling for updates every 30 seconds if logged in
    effect(() => {
      const user = this.auth.currentUser();
      if (user) {
        this.startPolling();
      } else {
        this.notifications.set([]);
        this.unreadCount.set(0);
      }
    }, { allowSignalWrites: true });
  }

  private startPolling() {
    timer(0, 30000).pipe(
      filter(() => !!this.auth.currentUser()),
      switchMap(() => this.http.get<Notification[]>(this.baseUrl).pipe(
        catchError(() => of([]))
      ))
    ).subscribe(data => {
      this.notifications.set(data);
      this.unreadCount.set(data.filter(n => !n.isRead).length);
    });
  }

  fetchNotifications() {
    this.http.get<Notification[]>(this.baseUrl).subscribe(data => {
      this.notifications.set(data);
      this.unreadCount.set(data.filter(n => !n.isRead).length);
    });
  }

  markAsRead(id: string) {
    this.http.patch(`${this.baseUrl}/${id}/read`, {}).subscribe(() => {
      this.notifications.update(list => 
        list.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      this.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  markAllAsRead() {
    this.http.patch(`${this.baseUrl}/read-all`, {}).subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
      this.unreadCount.set(0);
    });
  }

  getHistory(page: number, limit: number) {
    return this.http.get<any>(`${this.baseUrl}/history?page=${page}&limit=${limit}`);
  }
}
