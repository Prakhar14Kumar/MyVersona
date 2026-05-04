import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { OfflineBanner } from "./OfflineBanner";
import { Navbar } from "./Navbar";
import { NotificationsPanel } from "./NotificationsPanel";
import { useNotifications } from "../hooks/useNotifications";
import { Home, Compass, School, Brain, MessageCircle, Bookmark, TrendingUp, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useState } from "react";

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  const { 
    notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification 
  } = useNotifications();

  const path = location.pathname.split("/")[1] || "home";
  const activePage = path === "feed" ? "home" : path === "chat" ? "messages" : path;

  const sidebarItems = [
    { icon: Home, label: "Home", id: "home" },
    { icon: Compass, label: "Explore", id: "explore" },
    { icon: School, label: "College", id: "college" },
    { icon: Brain, label: "AI Career", id: "career" },
    { icon: MessageCircle, label: "Messages", id: "messages" },
    { icon: Bookmark, label: "Saved", id: "bookmarks" },
    { icon: TrendingUp, label: "Creator", id: "creator" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  const handleNavigation = (id: string) => {
    const destination = id === "home" ? "feed" : id === "messages" ? "chat" : id;
    navigate(`/${destination}`);
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      <OfflineBanner />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex shrink-0">
          <Sidebar />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden">
           <Outlet />
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="lg:hidden shrink-0 bg-white border-t border-border shadow-lg">
        <div className="grid grid-cols-5 h-16">
          {sidebarItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`flex flex-col items-center justify-center gap-1 text-[10px] transition-colors ${
                  isActive ? "text-[#FF6F91]" : "text-muted-foreground hover:text-[#FF6F91]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
