import { useState } from "react";
import { X, Bell, Heart, MessageCircle, UserPlus, Briefcase, Calendar, CheckCheck } from "lucide-react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

interface Notification {
  id: string;
  type: string;
  user_id?: string;
  username?: string;
  message: string;
  timestamp: string;
  read?: boolean;
  avatar?: string;
  post_id?: string;
}

interface NotificationsPanelProps {
  notifications: Notification[];
  unreadCount: number;
  onClose: () => void;
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotification: (notificationId: string) => void;
}

export function NotificationsPanel({
  notifications,
  unreadCount,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotification,
}: NotificationsPanelProps) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'post_like':
        return <Heart className="size-4 text-[#FF6F91]" />;
      case 'post_comment':
        return <MessageCircle className="size-4 text-[#6DE7C5]" />;
      case 'new_follower':
        return <UserPlus className="size-4 text-[#FFB88C]" />;
      case 'new_post':
        return <Bell className="size-4 text-[#FF6F91]" />;
      case 'job_alert':
        return <Briefcase className="size-4 text-[#6DE7C5]" />;
      case 'event_reminder':
        return <Calendar className="size-4 text-[#FFB88C]" />;
      default:
        return <Bell className="size-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed top-16 right-4 w-96 max-h-[600px] bg-white rounded-lg shadow-xl border border-border z-50">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-[#FF6F91]" />
          <h3>Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllAsRead}
              className="text-xs"
            >
              <CheckCheck className="size-4 mr-1" />
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <ScrollArea className="h-[500px]">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="size-12 mx-auto mb-4 opacity-20" />
            <p>No notifications yet</p>
            <p className="text-sm mt-2">We'll notify you when something happens</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-accent/50 transition-colors cursor-pointer group ${
                  !notification.read ? 'bg-[#FF6F91]/5' : ''
                }`}
                onClick={() => !notification.read && onMarkAsRead(notification.id)}
              >
                <div className="flex gap-3">
                  <div className="relative">
                    {notification.avatar ? (
                      <Avatar className="size-10">
                        <AvatarImage src={notification.avatar} />
                        <AvatarFallback>
                          {notification.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="size-10 rounded-full bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                    {!notification.read && (
                      <div className="absolute -top-1 -right-1 size-3 bg-[#FF6F91] rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {notification.username && (
                        <span className="font-medium">{notification.username} </span>
                      )}
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity size-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearNotification(notification.id);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t text-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-[#FF6F91] hover:text-[#FF6F91]/80"
          >
            View All Notifications
          </Button>
        </div>
      )}
    </div>
  );
}
