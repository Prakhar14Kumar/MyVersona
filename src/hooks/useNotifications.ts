import { useState, useEffect, useCallback, useRef } from 'react';
import { backendService } from '../lib/backendService';
import { wsService } from '../lib/websocketService';
import { subscribeToNotifications } from '../lib/firestoreService';
import { migrateUserNotifications } from '../lib/notificationMigration';
import { useAuth } from './useAuth';
import { toast } from 'sonner@2.0.3';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // Track whether the backend was reachable on the last fetch so we know
  // whether to keep the Firestore real-time listener alive.
  const backendReachableRef = useRef<boolean | null>(null);
  const migrationAttemptedRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await backendService.getNotifications(20);
      setNotifications(data.notifications);
      const unread = data.notifications.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
      // Mark backend as reachable if we got data (even empty array is OK –
      // the backendService already fell back to Firestore silently if needed)
      backendReachableRef.current = true;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      backendReachableRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Auto-migrate legacy notifications on first mount (fire-and-forget)
    if (!migrationAttemptedRef.current) {
      migrationAttemptedRef.current = true;
      migrateUserNotifications(user.uid).catch((err) => {
        console.log('Migration skipped or failed (non-critical):', err);
      });
    }

    fetchNotifications();

    // ── Firestore real-time listener (always active as the reliable fallback) ──
    const unsubscribeFirestore = subscribeToNotifications(
      user.uid,
      (firestoreNotifications) => {
        // Only use the Firestore stream to update state when we have data;
        // The backend WebSocket (below) will override if it connects.
        setNotifications(firestoreNotifications);
        const unread = firestoreNotifications.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      },
      20
    );

    // ── Backend WebSocket (best-effort; silently skipped when backend is down) ──
    let unsubscribeWs: (() => void) | null = null;
    try {
      wsService.connect('notifications', user.uid);

      unsubscribeWs = wsService.subscribe('notifications', (data: any) => {
        if (data.type === 'notification') {
          setNotifications((prev) => [data.notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast.info(data.notification.message, {
            description: data.notification.actor_username
              ? `From ${data.notification.actor_username}`
              : undefined,
          });
        } else if (data.type === 'notification_read') {
          setNotifications((prev) =>
            prev.map((n) =>
              n.notification_id === data.notification_id ? { ...n, is_read: true } : n
            )
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        } else if (data.type === 'all_read') {
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
          setUnreadCount(0);
        }
      });
    } catch {
      // WebSocket unavailable – Firestore listener above handles real-time updates
    }

    return () => {
      unsubscribeFirestore();
      if (unsubscribeWs) unsubscribeWs();
      try {
        wsService.disconnect('notifications', user.uid);
      } catch {
        // Ignore if WebSocket was never connected
      }
    };
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await backendService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await backendService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await backendService.deleteNotification(id);
      const deleted = notifications.find((n) => n.notification_id === id);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
      if (deleted && !deleted.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}