import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Bell, Home, Compass, GraduationCap, MessageCircle, Settings, Briefcase, LogOut, Search, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { signOut } from "../lib/firebaseAuth";
import { useNavigate, useLocation } from "react-router";
import { searchUsers, searchInsights } from "../lib/algolia";
import versonaLogo from "../assets/Logo.jpg";

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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        try {
          const res = await searchUsers(searchQuery);
          setSearchResults(res && res.hits ? res.hits.slice(0, 5) : []);
          setShowDropdown(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

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
          <img src={versonaLogo} alt="MyVerSona" className="h-8 w-auto" />
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
              
              {/* Global Search Bar */}
              <div className="relative ml-2">
                <div className="relative flex items-center">
                  <Search className="absolute left-2 size-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-8 pr-4 py-1.5 h-8 text-sm bg-gray-100 rounded-full border-none focus:ring-2 focus:ring-[#FF6F91]/20 w-48 transition-all focus:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  />
                </div>
                
                {/* Autocomplete Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute top-10 left-0 w-64 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden py-2 z-50">
                    <p className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase">Users</p>
                    {searchResults.map((result) => (
                      <div
                        key={result.objectID}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                        onClick={() => {
                          searchInsights('clickedObjectIDsAfterSearch', {
                            index: 'users',
                            eventName: 'Navbar Search Clicked',
                            queryID: result.__queryID,
                            objectIDs: [result.objectID]
                          });
                          navigate(`/profile/${result.uid || result.objectID}`);
                          setShowDropdown(false);
                          setSearchQuery('');
                        }}
                      >
                        <div className="size-8 rounded-full overflow-hidden bg-gray-100">
                          {result.avatar_url ? (
                            <img src={result.avatar_url} className="size-full object-cover" />
                          ) : (
                            <div className="size-full flex items-center justify-center text-[#FF6F91] font-bold text-xs">
                              {(result.full_name || 'U')[0]}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.full_name}</p>
                          <p className="text-xs text-gray-500 truncate">@{result.username}</p>
                        </div>
                      </div>
                    ))}
                    <div 
                      className="px-4 py-2 mt-1 border-t text-xs text-center text-[#FF6F91] hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        navigate('/search');
                        setShowDropdown(false);
                      }}
                    >
                      See all results
                    </div>
                  </div>
                )}
              </div>
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