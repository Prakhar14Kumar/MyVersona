import { useState, useEffect } from "react";
import { Home, Compass, School, Bookmark, MessageCircle, Settings, Bell, Search, MapPin, Calendar, Users, TrendingUp, Hash, Sparkles, Briefcase, Filter, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useAuth } from "../hooks/useAuth";
import { signOut as firebaseSignOut } from "../lib/firebaseAuth";
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner@2.0.3";
import { backendService } from "../lib/backendService";
import { FeedbackButton } from "./FeedbackButton";

interface ExplorePageProps {
  onNavigate: (page: string) => void;
  onlineUsers?: Set<string>;
  isUserOnline?: (userId: string) => boolean;
}

export function ExplorePage({ onNavigate, onlineUsers = new Set(), isUserOnline = () => false }: ExplorePageProps) {
  const { user, userProfile } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activePage, setActivePage] = useState("explore");
  const [trendingPeople, setTrendingPeople] = useState<any[]>([]);
  const [featuredColleges, setFeaturedColleges] = useState<any[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [loadingColleges, setLoadingColleges] = useState(true);

  // Fetch trending people from API
  useEffect(() => {
    const fetchTrendingPeople = async () => {
      try {
        setLoadingPeople(true);
        const response = await backendService.getTrending("people");
        
        // Map API response to UI format
        const mappedPeople = response.map((person: any) => ({
          id: person.uid,
          name: person.displayName || "Unknown User",
          avatar: person.photoURL || "",
          college: person.college ? `#${person.college.toLowerCase().replace(/\s+/g, '')}` : "#student",
          role: person.role || "Student",
          followers: person.followersCount ? `${(person.followersCount / 1000).toFixed(1)}k` : "0",
          mutualConnections: 0, // TODO: Calculate from backend
        }));
        
        setTrendingPeople(mappedPeople);
      } catch (error) {
        console.error("Failed to fetch trending people:", error);
      } finally {
        setLoadingPeople(false);
      }
    };

    fetchTrendingPeople();
  }, []);

  // Fetch trending colleges from API
  useEffect(() => {
    const fetchTrendingColleges = async () => {
      try {
        setLoadingColleges(true);
        const response = await backendService.getTrending("colleges");
        
        // Map API response to UI format
        const mappedColleges = response.map((college: any) => ({
          id: college.id,
          name: college.name,
          hashtag: college.hashtag || `#${college.name.toLowerCase().replace(/\s+/g, '')}`,
          image: college.banner || "https://images.unsplash.com/photo-1562774053-701939374585?w=800&fit=crop",
          members: college.membersCount ? `${(college.membersCount / 1000).toFixed(1)}k` : "0",
          posts: college.postsCount ? `${(college.postsCount / 1000).toFixed(1)}k` : "0",
          location: college.location || "India",
        }));
        
        setFeaturedColleges(mappedColleges);
      } catch (error) {
        console.error("Failed to fetch trending colleges:", error);
      } finally {
        setLoadingColleges(false);
      }
    };

    fetchTrendingColleges();
  }, []);

  const categories = [
    { id: "all", label: "All", icon: Sparkles },
    { id: "people", label: "People", icon: Users },
    { id: "colleges", label: "Colleges", icon: School },
    { id: "events", label: "Events", icon: Calendar },
    { id: "hashtags", label: "Hashtags", icon: Hash },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "TechFest 2025",
      college: "#iitdelhi",
      date: "Nov 15-17, 2025",
      attendees: "500+",
      image: "https://images.unsplash.com/photo-1623121608226-ca93dec4d94e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNoJTIwd29ya3Nob3AlMjBldmVudHxlbnwxfHx8fDE3NjA2ODAxMzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Technology",
    },
    {
      id: 2,
      title: "Career Fair 2025",
      college: "#bitspilani",
      date: "Nov 20, 2025",
      attendees: "1000+",
      image: "https://images.unsplash.com/photo-1698047682091-782b1e5c6536?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXJlZXIlMjBvcHBvcnR1bml0aWVzfGVufDF8fHx8MTc2MDY4MDEzOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Career",
    },
    {
      id: 3,
      title: "Hackathon 48hrs",
      college: "#vitvellore",
      date: "Dec 1-3, 2025",
      attendees: "300+",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYWNrYXRob258ZW58MXx8fHwxNzYwNjgwMTM5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "Competition",
    },
  ];

  const trendingHashtags = [
    { tag: "#collegelife", posts: "12.5k", growth: "+15%" },
    { tag: "#internships2025", posts: "8.3k", growth: "+25%" },
    { tag: "#campusfest", posts: "6.2k", growth: "+10%" },
    { tag: "#techtalks", posts: "5.8k", growth: "+18%" },
    { tag: "#studyabroad", posts: "4.9k", growth: "+12%" },
  ];

  const sidebarItems = [
    { icon: Home, label: "Home", id: "home" },
    { icon: Compass, label: "Explore", id: "explore" },
    { icon: School, label: "College", id: "college" },
    { icon: Bookmark, label: "Saved", id: "saved" },
    { icon: MessageCircle, label: "Messages", id: "messages" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-border fixed left-0 top-0 h-full flex flex-col">
        <div className="p-6 border-b flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("feed")}>
          <img src="/logo.jpg" alt="MyVerSona" className="h-8 w-auto rounded-lg shadow-sm" />
          <div className="text-xl font-bold bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
            MyVerSona
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center gap-3 cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-colors" onClick={() => onNavigate("settings")}>
            <Avatar>
              <AvatarImage src={userProfile?.photoURL || user?.photoURL} />
              <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate">{user?.displayName || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">
                {userProfile?.college ? `#${userProfile.college.toLowerCase().replace(/\s+/g, '')}` : '#student'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActivePage(item.id);
                  if (item.id === "home") onNavigate("feed");
                  if (item.id === "college") onNavigate("college");
                  if (item.id === "messages") onNavigate("chat");
                  if (item.id === "settings") onNavigate("settings");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 text-[#FF6F91]"
                    : "hover:bg-accent"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={async () => {
              try {
                await firebaseSignOut();
                onNavigate("landing");
              } catch (error) {
                console.error("Logout error:", error);
                toast.error("Failed to logout");
              }
            }}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 mr-80">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-border">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2>Explore MyVerSona</h2>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                </Button>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search people, colleges, events, hashtags..."
                className="pl-10"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = activeCategory === category.id;
                return (
                  <Button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    variant={isActive ? "default" : "outline"}
                    size="sm"
                    className={`gap-2 whitespace-nowrap ${
                      isActive
                        ? "bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
                        : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Trending People */}
          {(activeCategory === "all" || activeCategory === "people") && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#FF6F91]" />
                  <h3>Trending People</h3>
                </div>
                <Button variant="ghost" size="sm" className="gap-2">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingPeople.map((person) => (
                  <Card key={person.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={person.avatar} />
                          <AvatarFallback>{person.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="truncate">{person.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{person.role}</p>
                          <p className="text-xs text-[#FF6F91]">{person.college}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">
                          <span>{person.followers} followers</span>
                          <span className="mx-2">•</span>
                          <span>{person.mutualConnections} mutual</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
                      >
                        Follow
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Featured Colleges */}
          {(activeCategory === "all" || activeCategory === "colleges") && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <School className="h-5 w-5 text-[#6DE7C5]" />
                  <h3>Featured Colleges</h3>
                </div>
                <Button variant="ghost" size="sm" className="gap-2">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featuredColleges.map((college) => (
                  <Card
                    key={college.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => onNavigate("college")}
                  >
                    <div className="relative h-32">
                      <ImageWithFallback
                        src={college.image}
                        alt={college.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2">
                        <p className="text-white">{college.name}</p>
                        <p className="text-white/80 text-xs">{college.location}</p>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary" className="bg-gradient-to-r from-[#FFB88C]/10 to-[#FF6F91]/10 text-[#FF6F91]">
                          {college.hashtag}
                        </Badge>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{college.members} members</span>
                        <span>{college.posts} posts</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                      >
                        Join Community
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Events */}
          {(activeCategory === "all" || activeCategory === "events") && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#FFD166]" />
                  <h3>Upcoming Events</h3>
                </div>
                <Button variant="ghost" size="sm" className="gap-2">
                  View All <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {upcomingEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40">
                      <ImageWithFallback
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 right-2 bg-white/90 text-foreground">
                        {event.category}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h4>{event.title}</h4>
                      <p className="text-xs text-[#FF6F91] mt-1">{event.college}</p>
                      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          <span>{event.attendees} attending</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3"
                      >
                        Register
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Trending Hashtags */}
          {(activeCategory === "all" || activeCategory === "hashtags") && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-[#FF6F91]" />
                  <h3>Trending Hashtags</h3>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {trendingHashtags.map((hashtag) => (
                  <Card
                    key={hashtag.tag}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-[#FF6F91]">{hashtag.tag}</p>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          {hashtag.growth}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{hashtag.posts} posts</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-80 bg-white border-l border-border fixed right-0 top-0 h-full overflow-y-auto">
        <div className="p-6 space-y-6">
          <div>
            <h3 className="mb-4">Suggested for You</h3>
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-[#FFB88C]" />
                    <p className="text-xs">Based on your interests</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Join #webdevelopment to connect with fellow developers
                  </p>
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    Explore
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="mb-4">Quick Stats</h3>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Active Colleges</span>
                  <span>150+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total Students</span>
                  <span>50k+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Active Recruiters</span>
                  <span>1.2k+</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Events This Month</span>
                  <span>120+</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="mb-4">Popular Categories</h3>
            <div className="space-y-2">
              {["Technology", "Business", "Arts", "Sports", "Science"].map((category) => (
                <Button
                  key={category}
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Floating Feedback Button */}
      <FeedbackButton currentPage="explore" />
    </div>
  );
}