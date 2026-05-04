import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Home,
  Compass,
  School,
  Brain,
  MessageCircle,
  Bookmark,
  TrendingUp,
  Settings,
  Search,
  Bell,
  Plus,
  Briefcase,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

import { useAuth } from "../hooks/useAuth";
import { signOut } from "../lib/firebaseAuth";
import type { Post } from "../lib/firestoreService";
import { subscribeToFeed } from "../lib/firestoreService";

import { PostCard } from "./PostCard";
import { CreatePost } from "./CreatePost";
import { PostSkeleton } from "./PostSkeleton";
import { ActivityPulse } from "./ActivityPulse";
import { FeedbackButton } from "./FeedbackButton";

import { getDemoPosts } from "../data/demoPosts";

import { toast } from "sonner";

interface FeedPageProps {
  onNavigate: (page: string) => void;
  websocket?: any;
}

export function FeedPage({ onNavigate }: FeedPageProps) {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();

  const [feedType, setFeedType] = useState<"entertainment" | "career">(
    "entertainment"
  );

  const [activePage, setActivePage] = useState("home");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [limitCount, setLimitCount] = useState(20);

  const observerTarget = useRef<HTMLDivElement>(null);

  /* --------------------------------------------- */
  /* Feed Listener */
  /* --------------------------------------------- */

  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setLimitCount(20);

    const unsubscribe = subscribeToFeed(
      feedType,
      limitCount,
      (newPosts) => {
        if (newPosts && newPosts.length > 0) {
          setPosts(newPosts);
          setHasMore(newPosts.length === limitCount);
        } else {
          const demoPosts = getDemoPosts(feedType);
          setPosts(demoPosts);
          setHasMore(false);
        }

        setLoading(false);
        setLoadingMore(false);
      },
      (error) => {
        console.error("Feed Load Error:", error);

        toast.error("Unable to load feed");

        setLoading(false);
        setLoadingMore(false);
      }
    );

    return () => unsubscribe();
  }, [feedType, limitCount]);

  /* --------------------------------------------- */
  /* Infinite Scroll */
  /* --------------------------------------------- */

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;

    setLoadingMore(true);
    setLimitCount((prev) => prev + 20);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loading &&
          !loadingMore
        ) {
          loadMore();
        }
      },
      {
        threshold: 0.1,
      }
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
  }, [hasMore, loading, loadingMore]);

  /* --------------------------------------------- */
  /* Sidebar Items */
  /* --------------------------------------------- */

  const sidebarItems = [
    {
      icon: Home,
      label: "Home",
      id: "home",
    },
    {
      icon: Compass,
      label: "Explore",
      id: "explore",
    },
    {
      icon: School,
      label: "College",
      id: "college",
    },
    {
      icon: Brain,
      label: "AI Career",
      id: "career",
    },
    {
      icon: MessageCircle,
      label: "Messages",
      id: "messages",
    },
    {
      icon: Bookmark,
      label: "Saved",
      id: "bookmarks",
    },
    {
      icon: TrendingUp,
      label: "Creator",
      id: "creator",
    },
    {
      icon: Settings,
      label: "Settings",
      id: "settings",
    },
  ];

  const handleNavigation = (id: string) => {
    setActivePage(id);

    const destination =
      id === "home"
        ? "feed"
        : id === "messages"
          ? "chat"
          : id === "bookmarks"
            ? "bookmarks"
            : id;

    if (onNavigate) {
      onNavigate(destination);
    } else {
      navigate(`/${destination}`);
    }
  };

  return (
    <>
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        {/* HEADER */}

        <header className="shrink-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* SEARCH */}

              <div className="w-full sm:max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />

                  <Input
                    placeholder="Search MyVerSona..."
                    className="pl-10 h-11 bg-background/60"
                  />
                </div>
              </div>

              {/* ACTIONS */}

              <div className="flex items-center justify-between sm:justify-end gap-3">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />

                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF6F91]"></span>
                </Button>

                <Button
                  className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90 shadow-md"
                  onClick={() => setShowCreatePost(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Post
                </Button>
              </div>
            </div>

            {/* FEED TOGGLE */}

            <div className="flex justify-center">
              <Tabs
                value={feedType}
                onValueChange={(value) =>
                  setFeedType(value as "entertainment" | "career")
                }
                className="w-full max-w-md"
              >
                <TabsList className="grid grid-cols-2 h-12 w-full">
                  <TabsTrigger
                    value="entertainment"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFB88C] data-[state=active]:to-[#FF6F91] data-[state=active]:text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Entertainment
                  </TabsTrigger>

                  <TabsTrigger
                    value="career"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF6F91] data-[state=active]:to-[#6DE7C5] data-[state=active]:text-white"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Career
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </header>

        {/* SCROLLABLE FEED AREA */}
        <div className="flex-1 overflow-y-auto scroll-smooth w-full flex justify-center">
          <div className="flex-1 min-w-0 max-w-2xl">
            {/* POSTS */}
            <div className="p-3 sm:p-5 lg:p-6 space-y-6 pb-24 lg:pb-6">
          {loading ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <p className="text-muted-foreground">
                No posts available in this feed.
              </p>

              <Button
                className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
                onClick={() => setShowCreatePost(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Post
              </Button>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.uid || ""}
                currentUserName={user?.displayName || "User"}
                currentUserAvatar={user?.photoURL || undefined}
                onNavigate={onNavigate}
              />
            ))
          )}

          {/* LOADING MORE */}

          {hasMore && (
            <div ref={observerTarget} className="flex justify-center py-6">
              <div className="flex items-center gap-3 text-muted-foreground">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF6F91]"></div>
                <span>Loading more posts...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR */}

      <aside className="hidden xl:block shrink-0 w-80 h-full bg-slate-50/60 border-l border-slate-200 overflow-y-auto backdrop-blur-sm">
        <div className="relative min-h-full p-6 overflow-hidden">
          {/* GLOW EFFECTS */}

          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-gradient-to-r from-[#6DE7C5] via-[#5DADE2] to-[#8E44AD] blur-3xl"></div>

            <div className="absolute bottom-10 left-0 w-64 h-64 rounded-full bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] blur-3xl"></div>
          </div>

          <div className="relative z-10 space-y-8">
            <ActivityPulse />

            {/* AI CARD */}

            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] blur opacity-20 group-hover:opacity-40 transition duration-700"></div>

              <div className="relative bg-white rounded-2xl p-6 shadow-xl overflow-hidden border border-white/50">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-[#FF6F91]/10 blur-2xl"></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF6F91]/10 text-[#FF6F91] border border-[#FF6F91]/20">
                        A.I. Insight 🇮🇳
                      </span>

                      <h3 className="mt-3 text-lg font-bold text-slate-800">
                        Boost Visibility
                      </h3>
                    </div>

                    <div className="p-2 rounded-xl bg-gradient-to-br from-[#FFB88C] to-[#FF6F91] shadow-lg group-hover:rotate-6 transition-transform duration-300">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    Your profile is the first thing top Indian MNCs check.
                    Adding recent projects can boost your reach by
                    <span className="font-bold text-[#FF6F91]"> 300%</span>.
                  </p>

                  <Button className="w-full mt-6 h-11 rounded-xl bg-slate-900 hover:bg-[#FF6F91] text-white transition-all duration-300">
                    Update My Profile
                  </Button>
                </div>
              </div>
            </div>

            {/* PLACEHOLDER */}

            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 bg-white/50 text-center space-y-2 opacity-70">
              <div className="w-10 h-10 rounded-full bg-slate-100 mx-auto"></div>

              <p className="text-xs font-medium text-slate-400">
                ML Recommendations
                <br />
                Coming Soon
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* CREATE POST DIALOG */}

      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>

          {user && (
            <CreatePost
              user={{ ...user, displayName: user.displayName || "User" }}
              userCollege={
                userProfile?.college
                  ? `#${userProfile.college
                    .toLowerCase()
                    .replace(/\s+/g, "")}`
                  : undefined
              }
              onPostCreated={() => setShowCreatePost(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* FEEDBACK BUTTON */}

      <FeedbackButton currentPage="feed" />
        </div>
      </div>
    </>
  );
}