import { useEffect, useCallback, useState } from 'react';
import { wsService, MessageHandler, ConnectionStatusHandler } from '../lib/websocketService';
import { FEATURE_FLAGS } from '../lib/config';

interface UseWebSocketOptions {
  endpoint: 'chat' | 'notifications' | 'presence';
  userId?: string;
  autoConnect?: boolean;
  onMessage?: MessageHandler;
  onStatusChange?: ConnectionStatusHandler;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  send: (data: any) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useWebSocket({
  endpoint,
  userId,
  autoConnect = true,
  onMessage,
  onStatusChange,
}: UseWebSocketOptions): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (userId && FEATURE_FLAGS.ENABLE_WEBSOCKET) {
      wsService.connect(endpoint, userId);
    }
  }, [endpoint, userId]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (userId) {
      wsService.disconnect(endpoint, userId);
    }
  }, [endpoint, userId]);

  // Send message through WebSocket
  const send = useCallback((data: any) => {
    if (userId && FEATURE_FLAGS.ENABLE_WEBSOCKET) {
      wsService.send(endpoint, userId, data);
    }
  }, [endpoint, userId]);

  // Set up WebSocket connection and handlers
  useEffect(() => {
    if (!userId || !FEATURE_FLAGS.ENABLE_WEBSOCKET) return;

    // Subscribe to messages
    const unsubscribeMessages = onMessage
      ? wsService.subscribe(endpoint, onMessage)
      : () => {};

    // Subscribe to status changes
    const unsubscribeStatus = wsService.subscribeToStatus(endpoint, (status) => {
      setConnectionStatus(status);
      setIsConnected(status === 'connected');
      if (onStatusChange) {
        onStatusChange(status);
      }
    });

    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      unsubscribeMessages();
      unsubscribeStatus();
      disconnect();
    };
  }, [endpoint, userId, autoConnect, onMessage, onStatusChange, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    send,
    connect,
    disconnect,
  };
}

// Specialized hook for chat WebSocket
export function useChatWebSocket(userId?: string, onMessage?: MessageHandler) {
  return useWebSocket({
    endpoint: 'chat',
    userId,
    onMessage,
  });
}

// Specialized hook for notifications WebSocket
export function useNotificationsWebSocket(userId?: string, onMessage?: MessageHandler) {
  return useWebSocket({
    endpoint: 'notifications',
    userId,
    onMessage,
  });
}

// Specialized hook for presence WebSocket
export function usePresenceWebSocket(userId?: string, onMessage?: MessageHandler) {
  return useWebSocket({
    endpoint: 'presence',
    userId,
    onMessage,
  });
}

// Hook for managing all WebSocket connections
export function useWebSocketManager(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  // Chat WebSocket
  const chat = useChatWebSocket(userId, (data) => {
    // Handle chat messages
    if (data.type === 'new_message') {
      // Trigger notification or update UI
      console.log('New message received:', data);
    }
  });

  // Notifications WebSocket
  const notificationsWs = useNotificationsWebSocket(userId, (data) => {
    if (data.type === 'new_notification') {
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    } else if (data.type === 'pending_notifications') {
      setNotifications(data.notifications);
      setUnreadCount(data.count);
    } else if (data.type === 'all_notifications_read') {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  });

  // Presence WebSocket
  const presence = usePresenceWebSocket(userId, (data) => {
    if (data.type === 'user_status_change') {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (data.status === 'online') {
          newSet.add(data.user_id);
        } else {
          newSet.delete(data.user_id);
        }
        return newSet;
      });
    } else if (data.type === 'users_status') {
      const onlineUserIds = Object.keys(data.statuses).filter(
        uid => data.statuses[uid].status === 'online'
      );
      setOnlineUsers(new Set(onlineUserIds));
    }
  });

  // Helper functions
  const sendChatMessage = useCallback((receiverId: string, content: string, chatType: 'casual' | 'professional' = 'casual', conversationId?: string) => {
    if (userId) {
      wsService.sendChatMessage(userId, receiverId, content, chatType, conversationId);
    }
  }, [userId]);

  const sendTypingIndicator = useCallback((receiverId: string, conversationId: string, isTyping: boolean = true) => {
    if (userId) {
      wsService.sendTypingIndicator(userId, receiverId, conversationId, isTyping);
    }
  }, [userId]);

  const markNotificationRead = useCallback((notificationId: string) => {
    if (userId) {
      wsService.markNotificationRead(userId, notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [userId]);

  const markAllNotificationsRead = useCallback(() => {
    if (userId) {
      wsService.markAllNotificationsRead(userId);
    }
  }, [userId]);

  const updatePresenceStatus = useCallback((status: string) => {
    if (userId) {
      wsService.updatePresenceStatus(userId, status);
    }
  }, [userId]);

  const checkUsersStatus = useCallback((userIds: string[]) => {
    if (userId) {
      wsService.checkUsersStatus(userId, userIds);
    }
  }, [userId]);

  const isUserOnline = useCallback((checkUserId: string) => {
    return onlineUsers.has(checkUserId);
  }, [onlineUsers]);

  return {
    chat,
    notifications: notificationsWs,
    presence,
    // State
    notificationsList: notifications,
    unreadCount,
    onlineUsers,
    isUserOnline,
    // Actions
    sendChatMessage,
    sendTypingIndicator,
    markNotificationRead,
    markAllNotificationsRead,
    updatePresenceStatus,
    checkUsersStatus,
  };
}