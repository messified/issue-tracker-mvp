import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject, timer, NEVER } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { 
  retry, 
  tap, 
  catchError, 
  takeUntil,
  delayWhen,
  retryWhen,
  switchMap
} from 'rxjs/operators';
// import { environment } from '../../../environments/environment';
import { WebSocketMessage, WebSocketMessageType } from '../models/websocket.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket$?: WebSocketSubject<WebSocketMessage>;
  private messagesSubject = new Subject<WebSocketMessage>();
  private connectionStateSubject = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();
  
  // Public observables
  public messages$ = this.messagesSubject.asObservable();
  public connectionState$ = this.connectionStateSubject.asObservable();
  
  // Configuration
  private reconnectInterval = 5000; // 5 seconds
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatInterval = 30000; // 30 seconds
  private heartbeatTimer?: any;

  constructor(private authService: AuthService) {
    console.log('[WebSocket] Service initialized');
  }

  /**
   * Connect to WebSocket server
   * Automatically includes JWT token for authentication
   */
  connect(): void {
    if (this.socket$ && !this.socket$.closed) {
      console.log('[WebSocket] Already connected');
      return;
    }

    const token = this.authService.getToken();
    if (!token) {
      console.error('[WebSocket] No auth token available');
      return;
    }

    // Build WebSocket URL with token
    // Convert http to ws for WebSocket protocol
    const wsUrl = `ws://localhost:8080/ws?token=${encodeURIComponent(token)}`;
    
    console.log('[WebSocket] Connecting to: ws://localhost:8080/ws');

    this.socket$ = webSocket<WebSocketMessage>({
      url: wsUrl,
      openObserver: {
        next: () => {
          console.log('[WebSocket] Connection established');
          this.connectionStateSubject.next(true);
          this.reconnectAttempts = 0;
          this.startHeartbeat();
        }
      },
      closeObserver: {
        next: () => {
          console.log('[WebSocket] Connection closed');
          this.connectionStateSubject.next(false);
          this.stopHeartbeat();
          this.handleReconnect();
        }
      },
      // Deserialize incoming messages
      deserializer: (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          return {
            ...data,
            timestamp: new Date(data.timestamp)
          };
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
          return e.data;
        }
      },
      // Serialize outgoing messages
      serializer: (value: WebSocketMessage) => JSON.stringify(value)
    });

    // Subscribe to messages
    this.socket$
      .pipe(
        tap(message => {
          console.log('[WebSocket] Received:', message.type, message);
          this.handleMessage(message);
        }),
        catchError(error => {
          console.error('[WebSocket] Error:', error);
          this.connectionStateSubject.next(false);
          return NEVER;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: msg => this.messagesSubject.next(msg),
        error: err => console.error('[WebSocket] Subscription error:', err),
        complete: () => console.log('[WebSocket] Subscription completed')
      });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('[WebSocket] Disconnecting...');
    this.stopHeartbeat();
    
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = undefined;
    }
    
    this.connectionStateSubject.next(false);
  }

  /**
   * Send message to WebSocket server
   */
  send(message: WebSocketMessage): void {
    if (!this.socket$) {
      console.warn('[WebSocket] Cannot send - not connected');
      return;
    }

    if (this.socket$.closed) {
      console.warn('[WebSocket] Cannot send - connection closed');
      this.connect(); // Try to reconnect
      return;
    }

    console.log('[WebSocket] Sending:', message.type, message);
    this.socket$.next(message);
  }

  /**
   * Subscribe to specific message types
   */
  onMessageType(type: WebSocketMessageType): Observable<WebSocketMessage> {
    return new Observable(observer => {
      const subscription = this.messages$.subscribe(message => {
        if (message.type === type) {
          observer.next(message);
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Subscribe to issue updates for a specific project
   */
  onProjectIssueUpdates(projectId: string): Observable<WebSocketMessage> {
    return new Observable(observer => {
      const subscription = this.messages$.subscribe(message => {
        if (
          (message.type === WebSocketMessageType.ISSUE_CREATED ||
           message.type === WebSocketMessageType.ISSUE_UPDATED ||
           message.type === WebSocketMessageType.ISSUE_DELETED) &&
          message.payload.projectId === projectId
        ) {
          observer.next(message);
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Subscribe to issue updates for a specific issue
   */
  onIssueUpdates(issueId: string): Observable<WebSocketMessage> {
    return new Observable(observer => {
      const subscription = this.messages$.subscribe(message => {
        if (
          (message.type === WebSocketMessageType.ISSUE_UPDATED ||
           message.type === WebSocketMessageType.COMMENT_ADDED ||
           message.type === WebSocketMessageType.COMMENT_UPDATED) &&
          (message.payload.id === issueId || message.payload.issueId === issueId)
        ) {
          observer.next(message);
        }
      });
      return () => subscription.unsubscribe();
    });
  }

  /**
   * Check if WebSocket is currently connected
   */
  isConnected(): boolean {
    return this.connectionStateSubject.value;
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case WebSocketMessageType.PONG:
        // Heartbeat response
        console.log('[WebSocket] Heartbeat response received');
        break;
        
      case WebSocketMessageType.ERROR:
        console.error('[WebSocket] Server error:', message.payload);
        break;
        
      case WebSocketMessageType.CONNECTED:
        console.log('[WebSocket] Server acknowledged connection');
        break;
        
      default:
        // All other messages are forwarded to subscribers
        break;
    }
  }

  /**
   * Handle reconnection logic
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.min(this.reconnectAttempts, 5);
    
    console.log(
      `[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.authService.getToken()) {
        console.log('[WebSocket] No token available, skipping reconnect');
        return;
      }
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.socket$ && !this.socket$.closed) {
        this.send({
          type: WebSocketMessageType.PING,
          payload: {},
          timestamp: new Date()
        });
      }
    }, this.heartbeatInterval);
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    console.log('[WebSocket] Service destroying');
    this.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }
}