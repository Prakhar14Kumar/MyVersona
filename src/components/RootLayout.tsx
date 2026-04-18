import { Outlet, useLocation } from "react-router";
import { useState } from "react";
import { Navbar } from "./Navbar";
import { NotificationsPanel } from "./NotificationsPanel";
import { OfflineBanner } from "./OfflineBanner";
import { useNotifications } from "../hooks/useNotifications";

const authPages = ["/", "/login", "/signup"];

export function RootLayout() {
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  const handleNotificationToggle = () => {
    setShowNotifications(!showNotifications);
  };

  const isAuthPage = authPages.includes(location.pathname);
  const showNavbar = !isAuthPage;

  return (
    <div className="size-full">
      <OfflineBanner />
      <div className="min-h-screen bg-background">
        {showNavbar && (
          <Navbar 
            unreadNotifications={unreadCount}
            onNotificationClick={handleNotificationToggle}
          />
        )}
        <main className={showNavbar ? "pt-16" : ""}>
          <Outlet />
        </main>

        {showNotifications && (
          <NotificationsPanel
            notifications={notifications}
            unreadCount={unreadCount}
            onClose={() => setShowNotifications(false)}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearNotification={deleteNotification}
          />
        )}
      </div>
    </div>
  );
}
