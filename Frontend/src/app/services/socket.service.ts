import { Injectable, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket?: Socket;
  private syncCompleteSubject = new Subject<any>();

  constructor(@Inject(PLATFORM_ID) private platformId: any) {
    if (isPlatformBrowser(this.platformId)) {
      // Connect only in the browser to avoid SSR stabilization issues
      this.socket = io('http://localhost:3000');

      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      this.socket.on('sync-complete', (data: any) => {
        console.log('Sync complete event received:', data);
        this.syncCompleteSubject.next(data);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });
    }
  }

  onSyncComplete(): Observable<any> {
    return this.syncCompleteSubject.asObservable();
  }

  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
