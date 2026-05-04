import {
  Home,
  Compass,
  School,
  Brain,
  MessageCircle,
  Bookmark,
  TrendingUp,
  Settings,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { signOut } from "../lib/firebaseAuth";
import { useNavigate, useLocation } from "react-router";

export function Sidebar() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active page from path
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
    <aside className="w-64 h-full bg-white border-r border-border flex flex-col shrink-0">
      {/* LOGO */}
      <div
        className="p-6 border-b flex items-center gap-3 cursor-pointer shrink-0"
        onClick={() => handleNavigation("home")}
      >
        <img
          src="/logo.jpg"
          alt="MyVerSona"
          className="h-9 w-9 rounded-xl object-cover shadow-md"
        />
        <h1 className="text-xl font-bold bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
          MyVerSona
        </h1>
      </div>

      {/* PROFILE CARD */}
      <div className="p-4 border-b shrink-0">
        <button
          onClick={() => handleNavigation("settings")}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-[#FFB88C]/5 via-[#FF6F91]/5 to-[#6DE7C5]/5 hover:shadow-md transition-all"
        >
          <Avatar className="h-12 w-12 border-2 border-white shadow-md shrink-0">
            <AvatarImage src={userProfile?.photoURL || user?.photoURL || ""} />
            <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="text-left flex-1 min-w-0">
            <p className="truncate font-medium">{user?.displayName || "User"}</p>
            <p className="text-xs text-[#FF6F91] truncate mt-1">
              {userProfile?.college ? `#${userProfile.college.toLowerCase().replace(/\s+/g, "")}` : "#student"}
            </p>
          </div>
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-gradient-to-r from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 text-[#FF6F91] shadow-sm"
                  : "hover:bg-accent text-slate-700"
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t space-y-3 shrink-0">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="text-lg">🇮🇳</span>
          <span>Made in India</span>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-700"
          onClick={async () => {
            await signOut();
            navigate("/");
          }}
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}
