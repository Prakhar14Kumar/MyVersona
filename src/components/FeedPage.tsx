import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Home, Compass, School, Brain, MessageCircle, Bookmark, TrendingUp, Settings, Search, Bell, Plus, Briefcase, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useAuth } from "../hooks/useAuth";
import { signOut } from "../lib/firebaseAuth";
import { backendService } from "../lib/backendService";
import type { Post } from "../lib/firestoreService";
import { PostCard } from "./PostCard";
import { CreatePost } from "./CreatePost";
import { ActivityPulse } from "./ActivityPulse";
import { FeedbackButton } from "./FeedbackButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { toast } from "sonner@2.0.3";

interface FeedPageProps {
  onNavigate: (page: string) => void;
  websocket?: any;
}

export function FeedPage({ onNavigate, websocket }: FeedPageProps) {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [feedType, setFeedType] = useState<"entertainment" | "career">("entertainment");
  const [activePage, setActivePage] = useState("home");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Load initial posts
  useEffect(() => {
    const loadInitialPosts = async () => {
      setLoading(true);
      setPosts([]); // Reset immediately
      try {
        const { posts: newPosts, lastPostId } = await backendService.getFeed(feedType, 20);
        setPosts(newPosts || []);
        setCursor(lastPostId);
        setHasMore(!!lastPostId && newPosts.length === 20);
      } catch (error) {
        console.error("Failed to load feed:", error);
        setPosts([]);
        setHasMore(false);
        toast.error("Failed to load feed. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    // Reset state when feedType changes
    setCursor(undefined);
    setHasMore(true);
    loadInitialPosts();
  }, [feedType]);

  // Load more posts
  const loadMore = async () => {
    if (loading || loadingMore || !cursor || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const { posts: newPosts, lastPostId } = await backendService.getFeed(feedType, 20, cursor);
      if (newPosts && newPosts.length > 0) {
        setPosts(prev => [...prev, ...newPosts]);
        setCursor(lastPostId);
        setHasMore(!!lastPostId && newPosts.length === 20);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Failed to load more posts:", error);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, cursor, feedType]); // Dependencies for closure freshness

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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar with 3D Effects */}
      <aside className="w-64 bg-white border-r border-border fixed left-0 top-0 h-full flex flex-col shadow-sm">
        {/* Logo Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] rounded-xl flex items-center justify-center shadow-lg"
                 style={{ transform: 'perspective(500px) rotateY(-10deg)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-xl bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent tracking-tight">
              VERSONA
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-[#FFB88C]/5 via-[#FF6F91]/5 to-[#6DE7C5]/5 hover:shadow-md transition-all cursor-pointer"
               style={{ transform: 'perspective(1000px) translateZ(0)' }}
               onClick={() => onNavigate ? onNavigate("settings") : navigate("/settings")}>
            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
              <AvatarImage src={userProfile?.photoURL || user?.photoURL} />
              <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate leading-tight">{user?.displayName || 'User'}</p>
              <p className="text-xs text-[#FF6F91] truncate leading-relaxed">
                {userProfile?.college ? `#${userProfile.college.toLowerCase().replace(/\s+/g, '')}` : '#student'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  const dest = item.id === "home" ? "feed" : item.id === "messages" ? "chat" : item.id === "bookmarks" ? "bookmarks" : item.id;
                  if (onNavigate) {
                    onNavigate(dest);
                  } else {
                    navigate(`/${dest}`);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 text-[#FF6F91] shadow-sm"
                    : "hover:bg-accent"
                }`}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* India Badge & Logout */}
        <div className="p-4 border-t space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="text-lg">🇮🇳</span>
            <span className="leading-tight">Made in India</span>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground transition-colors"
            onClick={async () => {
              await signOut();
              if (onNavigate) {
                onNavigate("landing");
              } else {
                navigate("/");
              }
            }}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 mr-80">
        {/* Top Header with Search */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search VerSona..."
                    className="pl-10 h-11 bg-background/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF6F91] rounded-full"></span>
                </Button>
                <Button
                  className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90 shadow-md transition-all hover:shadow-lg"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
            </div>

            {/* Feed Toggle */}
            <div className="flex justify-center">
              <Tabs value={feedType} onValueChange={(v) => setFeedType(v as any)} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger 
                    value="entertainment" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFB88C] data-[state=active]:to-[#FF6F91] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span className="leading-tight">Entertainment</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="career" 
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6F91] data-[state=active]:to-[#6DE7C5] data-[state=active]:text-white data-[state=active]:shadow-md transition-all"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span className="leading-tight">Career</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="p-6 space-y-6 max-w-2xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6F91]"></div>
                <span className="leading-tight">Loading posts...</span>
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="space-y-3">
                <p className="text-muted-foreground leading-tight">No posts yet in this feed</p>
                <Button 
                  className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.uid || ""}
                currentUserName={user?.displayName || "User"}
                currentUserAvatar={user?.photoURL}
                onNavigate={onNavigate}
              />
            ))
          )}
          {hasMore && (
            <div ref={observerTarget} className="text-center py-6">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6F91]"></div>
                <span className="leading-tight">Loading more posts...</span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-80 bg-white border-l border-border fixed right-0 top-0 h-full overflow-y-auto shadow-sm">
        <div className="p-6 space-y-6">
          {/* Smart Activity Pulse - NEW FEATURE */}
          <ActivityPulse />

          {/* Trending Colleges - Removed hardcoded data for beta stability */}
          {/* Will be replaced with real trending data from backend */}
          
          {/* Suggested Connections - Removed hardcoded data for beta stability */}
          {/* Will be replaced with ML-powered recommendations */}

          {/* AI Career Tip Card - Indian themed */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 rounded-2xl p-5 space-y-4 border-2 border-[#FF6F91]/20 shadow-md"
               style={{ transform: 'perspective(1000px) translateZ(0)' }}>
            {/* Indian Pattern Overlay */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23FF6F91' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
            }}></div>
            
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h4 className="leading-tight tracking-tight">AI Career Tip 🇮🇳</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Update your profile with recent projects and skills. Recruiters from top Indian companies are 3x more likely to notice active profiles!
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full bg-white hover:bg-[#FF6F91] hover:text-white hover:border-[#FF6F91] transition-all shadow-sm"
              >
                Update Profile Now
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Create Post Dialog */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          {user && (
            <CreatePost
              user={user}
              userCollege={userProfile?.college ? `#${userProfile.college.toLowerCase().replace(/\\s+/g, '')}` : undefined}
              onPostCreated={() => setShowCreatePost(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Floating Feedback Button */}
      <FeedbackButton currentPage="feed" />
    </div>
  );
}