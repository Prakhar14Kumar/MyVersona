import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Bell, Home, Compass, GraduationCap, MessageCircle, Settings, Briefcase, LogOut, Search, Video } from "lucide-react";
import { useApp } from "../contexts/AppContext";
import { signOut } from "../lib/firebaseAuth";
import { useNavigate, useLocation } from "react-router";
import versonaLogo from "figma:asset/ef2e50ad7a151d7b9c86737646c4bf1acd9e7285.png";

interface NavbarProps {
  unreadNotifications?: number;
  onNotificationClick?: () => void;
}

export function Navbar({ unreadNotifications = 0, onNotificationClick }: NavbarProps) {
  const { user, userProfile } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!user;
  const currentPage = location.pathname.slice(1) || "landing";

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  const navItems = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "reels", label: "Reels", icon: Video },
    { id: "explore", label: "Explore", icon: Compass },
    { id: "college", label: "College", icon: GraduationCap },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "career", label: "Career", icon: Briefcase },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div 
          className="cursor-pointer"
          onClick={() => navigate(isAuthenticated ? "/feed" : "/")}
        >
          <img src={versonaLogo} alt="VerSona" className="h-8 w-auto" />
        </div>
        
        {isAuthenticated ? (
          <>
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate(`/${item.id}`)}
                  className={currentPage === item.id ? "bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5]" : ""}
                >
                  <item.icon className="size-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={onNotificationClick}
              >
                <Bell className="size-5" />
                {unreadNotifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </Badge>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/settings")}
              >
                <Settings className="size-5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
              >
                <LogOut className="size-5" />
              </Button>

              {userProfile?.photoURL && (
                <div 
                  className="size-8 rounded-full overflow-hidden cursor-pointer border-2 border-[#FF6F91]"
                  onClick={() => navigate("/profile")}
                >
                  <img 
                    src={userProfile.photoURL} 
                    alt="Profile" 
                    className="size-full object-cover"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="hidden md:flex items-center gap-8">
              <button
                onClick={() => navigate("/")}
                className={`transition-colors ${
                  currentPage === "" || currentPage === "landing"
                    ? "text-[#FF6F91]" 
                    : "text-foreground hover:text-[#FF6F91]"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigate("/about")}
                className="text-foreground hover:text-[#FF6F91] transition-colors"
              >
                About
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
                onClick={() => navigate("/signup")}
              >
                Join Now
              </Button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}