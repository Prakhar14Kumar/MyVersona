import { WS_CONFIG } from './config';
import { NETWORK_CONFIG } from './networkConfig';
import { networkMonitor } from './networkMonitor';

type MessageHandler = (data: any) => void;
type ConnectionStatusHandler = (status: 'connected' | 'disconnected' | 'reconnecting') => void;

interface WebSocketOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  enableFallback?: boolean;
  messageTimeout?: number;
}

// Message acknowledgment tracking
interface PendingMessage {
  id: string;
  data: any;
  timestamp: number;
  retries: number;
}

class WebSocketService {
  private sockets: Map<string, WebSocket> = new Map();
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private statusHandlers: Map<string, Set<ConnectionStatusHandler>> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private heartbeatIntervals: Map<string, NodeJS.Timeout> = new Map();
  private messageQueues: Map<string, PendingMessage[]> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private connectionTimeouts: Map<string, NodeJS.Timeout> = new Map();
  
  private options: Required<WebSocketOptions> = {
    reconnectInterval: NETWORK_CONFIG.TIMEOUT.WS_RECONNECT_TIMEOUT,
    maxReconnectAttempts: 5,
    heartbeatInterval: NETWORK_CONFIG.TIMEOUT.WS_HEARTBEAT_INTERVAL,
    enableFallback: NETWORK_CONFIG.WS_FALLBACK.ENABLE_POLLING,
    messageTimeout: NETWORK_CONFIG.TIMEOUT.WS_MESSAGE_TIMEOUT,
  };

  constructor(options?: WebSocketOptions) {
    if (options) {
      this.options = { ...this.options, ...options };
    }
    
    // Listen to network quality changes
    networkMonitor.subscribe((quality) => {
      console.log(`🔌 WebSocket adapting to network quality: ${quality}`);
      this.adaptToNetworkQuality(quality);
    });
  }

  /**
   * Connect to a WebSocket endpoint
   */
  connect(endpoint: string, userId: string): void {
    const key = `${endpoint}_${userId}`;
    
    // Close existing connection if any
    if (this.sockets.has(key)) {
      this.disconnect(endpoint, userId);
    }

    try {
      const wsUrl = this.getWebSocketUrl(endpoint, userId);
      console.log(`🔌 Connecting WebSocket: ${endpoint} at ${wsUrl}`);
      
      const socket = new WebSocket(wsUrl);
      this.sockets.set(key, socket);
      
      socket.onopen = () => {
        console.log(`✅ WebSocket connected: ${endpoint}`);
        this.notifyStatusHandlers(endpoint, 'connected');
        this.startHeartbeat(key, socket);
        this.reconnectAttempts.set(key, 0);
        this.sendQueuedMessages(key, socket);
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'heartbeat_ack') return;
          
          if (data.messageId) {
            this.removeFromQueue(key, data.messageId);
          }
          
          this.handleMessage(endpoint, data);
        } catch (error) {
          console.error(`Error parsing WebSocket message from ${endpoint}:`, error);
        }
      };
      
      socket.onclose = (event) => {
        this.stopHeartbeat(key);
        
        if (!event.wasClean) {
          this.notifyStatusHandlers(endpoint, 'disconnected');
          this.handleConnectionFailure(endpoint, userId);
          
          // Reconnect logic
          const attempts = this.reconnectAttempts.get(key) || 0;
          if (attempts < this.options.maxReconnectAttempts) {
            this.notifyStatusHandlers(endpoint, 'reconnecting');
            this.reconnectAttempts.set(key, attempts + 1);
            
            const delay = this.calculateReconnectDelay(attempts);
            console.log(`🔄 Reconnecting WebSocket ${endpoint} in ${delay}ms (Attempt ${attempts + 1})`);
            
            setTimeout(() => {
              this.connect(endpoint, userId);
            }, delay);
          }
        } else {
          this.notifyStatusHandlers(endpoint, 'disconnected');
          this.sockets.delete(key);
        }
      };
      
      socket.onerror = (error) => {
        console.error(`❌ WebSocket error for ${endpoint}:`, error);
        // Let onclose handle the reconnection
      };

    } catch (error) {
      console.error(`❌ Failed to create WebSocket connection for ${endpoint}:`, error);
      this.notifyStatusHandlers(endpoint, 'disconnected');
      this.handleConnectionFailure(endpoint, userId);
    }
  }

  /**
   * Disconnect from a WebSocket endpoint
   */
  disconnect(endpoint: string, userId: string): void {
    const key = `${endpoint}_${userId}`;
    const socket = this.sockets.get(key);
    
    if (socket) {
      this.stopHeartbeat(key);
      socket.close();
      this.sockets.delete(key);
      this.reconnectAttempts.delete(key);
      this.messageQueues.delete(key);
      this.pollingIntervals.delete(key);
    }
  }

  /**
   * Disconnect all WebSocket connections
   */
  disconnectAll(): void {
    for (const [key, socket] of this.sockets.entries()) {
      this.stopHeartbeat(key);
      socket.close();
    }
    this.sockets.clear();
    this.reconnectAttempts.clear();
    this.messageQueues.clear();
    this.pollingIntervals.clear();
  }

  /**
   * Send a message through WebSocket
   */
  send(endpoint: string, userId: string, data: any): void {
    const key = `${endpoint}_${userId}`;
    const socket = this.sockets.get(key);
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      const messageId = this.generateMessageId();
      const message: PendingMessage = {
        id: messageId,
        data: data,
        timestamp: Date.now(),
        retries: 0,
      };
      
      // Add to queue
      if (!this.messageQueues.has(key)) {
        this.messageQueues.set(key, []);
      }
      this.messageQueues.get(key)!.push(message);
      
      // Send message
      socket.send(JSON.stringify({ ...data, messageId }));
    } else {
      console.warn(`WebSocket not connected: ${endpoint}`);
    }
  }

  /**
   * Subscribe to messages from a WebSocket endpoint
   */
  subscribe(endpoint: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(endpoint)) {
      this.messageHandlers.set(endpoint, new Set());
    }
    
    this.messageHandlers.get(endpoint)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.messageHandlers.get(endpoint);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Subscribe to connection status changes
   */
  subscribeToStatus(endpoint: string, handler: ConnectionStatusHandler): () => void {
    if (!this.statusHandlers.has(endpoint)) {
      this.statusHandlers.set(endpoint, new Set());
    }
    
    this.statusHandlers.get(endpoint)!.add(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.statusHandlers.get(endpoint);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Check if connected to an endpoint
   */
  isConnected(endpoint: string, userId: string): boolean {
    const key = `${endpoint}_${userId}`;
    const socket = this.sockets.get(key);
    return socket !== undefined && socket.readyState === WebSocket.OPEN;
  }

  /**
   * Send a chat message
   */
  sendChatMessage(userId: string, receiverId: string, content: string, chatType: 'casual' | 'professional' = 'casual', conversationId?: string): void {
    this.send('chat', userId, {
      type: 'send_message',
      receiver_id: receiverId,
      content,
      chat_type: chatType,
      conversation_id: conversationId,
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(userId: string, receiverId: string, conversationId: string, isTyping: boolean = true): void {
    this.send('chat', userId, {
      type: 'typing',
      receiver_id: receiverId,
      conversation_id: conversationId,
      is_typing: isTyping,
    });
  }

  /**
   * Send read receipt
   */
  sendReadReceipt(userId: string, conversationId: string): void {
    this.send('chat', userId, {
      type: 'read_receipt',
      conversation_id: conversationId,
    });
  }

  /**
   * Join a conversation
   */
  joinConversation(userId: string, conversationId: string): void {
    this.send('chat', userId, {
      type: 'join_conversation',
      conversation_id: conversationId,
    });
  }

  /**
   * Leave a conversation
   */
  leaveConversation(userId: string, conversationId: string): void {
    this.send('chat', userId, {
      type: 'leave_conversation',
      conversation_id: conversationId,
    });
  }

  /**
   * Send AI query
   */
  sendAIQuery(userId: string, query: string): void {
    this.send('chat', userId, {
      type: 'ai_query',
      query,
    });
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(userId: string, notificationId: string): void {
    this.send('notifications', userId, {
      type: 'mark_read',
      notification_id: notificationId,
    });
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead(userId: string): void {
    this.send('notifications', userId, {
      type: 'mark_all_read',
    });
  }

  /**
   * Clear a notification
   */
  clearNotification(userId: string, notificationId: string): void {
    this.send('notifications', userId, {
      type: 'clear_notification',
      notification_id: notificationId,
    });
  }

  /**
   * Update presence status
   */
  updatePresenceStatus(userId: string, status: string): void {
    this.send('presence', userId, {
      type: 'status_update',
      status,
    });
  }

  /**
   * Update user activity
   */
  updateActivity(userId: string, activityType: string, targetId: string, isActive: boolean = true): void {
    this.send('presence', userId, {
      type: 'activity',
      activity_type: activityType,
      target_id: targetId,
      is_active: isActive,
    });
  }

  /**
   * Check status of multiple users
   */
  checkUsersStatus(userId: string, userIds: string[]): void {
    this.send('presence', userId, {
      type: 'check_status',
      user_ids: userIds,
    });
  }

  // Private methods

  private getWebSocketUrl(endpoint: string, userId: string): string {
    return WS_CONFIG.getWebSocketUrl(endpoint, userId);
  }

  private handleMessage(endpoint: string, data: any): void {
    const handlers = this.messageHandlers.get(endpoint);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Message handler error:', error);
        }
      });
    }
  }

  private notifyStatusHandlers(endpoint: string, status: 'connected' | 'disconnected' | 'reconnecting'): void {
    const handlers = this.statusHandlers.get(endpoint);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(status);
        } catch (error) {
          console.error('Status handler error:', error);
        }
      });
    }
  }

  private startHeartbeat(key: string, socket: WebSocket): void {
    const interval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'heartbeat' }));
      }
    }, this.options.heartbeatInterval);
    
    this.heartbeatIntervals.set(key, interval);
  }

  private stopHeartbeat(key: string): void {
    const interval = this.heartbeatIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.heartbeatIntervals.delete(key);
    }
  }

  private generateMessageId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private removeFromQueue(key: string, messageId: string): void {
    const queue = this.messageQueues.get(key);
    if (queue) {
      const index = queue.findIndex(msg => msg.id === messageId);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    }
  }

  private sendQueuedMessages(key: string, socket: WebSocket): void {
    const queue = this.messageQueues.get(key);
    if (queue) {
      queue.forEach(msg => {
        socket.send(JSON.stringify({ ...msg.data, messageId: msg.id }));
      });
    }
  }

  private handleConnectionFailure(endpoint: string, userId: string): void {
    // Fall back to polling if enabled
    if (this.options.enableFallback) {
      this.startPolling(endpoint, userId);
    }
  }

  private startPolling(endpoint: string, userId: string): void {
    const key = `${endpoint}_${userId}`;
    const interval = setInterval(() => {
      // Simulate polling by sending a heartbeat
      this.send(endpoint, userId, { type: 'heartbeat' });
    }, this.options.heartbeatInterval);
    
    this.pollingIntervals.set(key, interval);
  }

  private stopPolling(key: string): void {
    const interval = this.pollingIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(key);
    }
  }

  private calculateReconnectDelay(attempts: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.options.reconnectInterval;
    const maxDelay = 30000; // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
    return delay + Math.random() * 1000; // Add jitter
  }

  private adaptToNetworkQuality(quality: 'good' | 'poor'): void {
    if (quality === 'poor') {
      // Increase reconnect interval and heartbeat interval
      this.options.reconnectInterval *= 2;
      this.options.heartbeatInterval *= 2;
    } else {
      // Reset to default values
      this.options.reconnectInterval = NETWORK_CONFIG.TIMEOUT.WS_RECONNECT_TIMEOUT;
      this.options.heartbeatInterval = NETWORK_CONFIG.TIMEOUT.WS_HEARTBEAT_INTERVAL;
    }
  }
}

// Export singleton instance
export const wsService = new WebSocketService();

// Export types
export type { MessageHandler, ConnectionStatusHandler, WebSocketOptions };