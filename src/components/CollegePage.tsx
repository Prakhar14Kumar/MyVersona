import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Users, Calendar, MapPin, TrendingUp, Plus, MessageCircle, Share2, Loader2, ArrowLeft, X, PartyPopper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CreatePost } from "./CreatePost";
import { PostCard } from "./PostCard";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner@2.0.3";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  arrayUnion,
  arrayRemove,
  getDocs 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import type { Post, UserProfile } from "../types";
import { trackCollegeJoined } from "../lib/userBehaviorTracker";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface CollegePageProps {
  collegeId?: string;
}

interface College {
  id: string;
  name: string;
  hashtag: string;
  banner: string;
  membersCount: number;
  postsCount: number;
  verified: boolean;
  location?: string;
}

interface Event {
  id: string;
  title: string;
  date: Date;
  location: string;
  attendees: string[];
  description?: string;
}

interface Student {
  uid: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  major?: string;
}

export function CollegePage() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const { collegeId } = useParams<{ collegeId?: string }>();
  const [college, setCollege] = useState<College | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joiningLoading, setJoiningLoading] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  
  // Tab-specific data
  const [collegePosts, setCollegePosts] = useState<Post[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [topCreators, setTopCreators] = useState<any[]>([]);
  
  // Get college ID from user's profile or props
  const currentCollegeId = collegeId || userProfile?.college?.toLowerCase().replace(/\s+/g, '');

  // Check if user just completed onboarding
  useEffect(() => {
    const justCompletedOnboarding = localStorage.getItem('versona-just-onboarded');
    if (justCompletedOnboarding === 'true' && isMember) {
      setShowWelcomeBanner(true);
      localStorage.removeItem('versona-just-onboarded');
    }
  }, [isMember]);

  // Load college data
  useEffect(() => {
    const loadCollege = async () => {
      if (!currentCollegeId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Try to load college document
        const collegeRef = doc(db, "colleges", currentCollegeId);
        const collegeDoc = await getDoc(collegeRef);
        
        if (collegeDoc.exists()) {
          const data = collegeDoc.data();
          setCollege({
            id: collegeDoc.id,
            name: data.name,
            hashtag: data.hashtag,
            banner: data.banner || "https://images.unsplash.com/photo-1613687969216-40c7b718c025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
            membersCount: data.membersCount || 0,
            postsCount: data.postsCount || 0,
            verified: data.verified || false,
            location: data.location
          });
          
          // Check if user is a member
          if (user) {
            const memberDoc = await getDoc(doc(db, "colleges", currentCollegeId, "members", user.uid));
            setIsMember(memberDoc.exists());
          }
        } else {
          // Create default college if doesn't exist
          const defaultCollege = {
            name: userProfile?.college || "My College",
            hashtag: `#${currentCollegeId}`,
            banner: "https://images.unsplash.com/photo-1613687969216-40c7b718c025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080",
            membersCount: 0,
            postsCount: 0,
            verified: false,
            createdAt: serverTimestamp()
          };
          
          await setDoc(collegeRef, defaultCollege);
          setCollege({
            id: currentCollegeId,
            ...defaultCollege,
            membersCount: 0,
            postsCount: 0
          } as College);
        }
      } catch (error) {
        console.error("Error loading college:", error);
        toast.error("Failed to load college data");
      } finally {
        setLoading(false);
      }
    };

    loadCollege();
  }, [currentCollegeId, user, userProfile]);

  // Load college feed posts
  useEffect(() => {
    const loadCollegePosts = async () => {
      if (!currentCollegeId) return;

      try {
        const postsQuery = query(
          collection(db, "posts"),
          where("userCollege", "==", userProfile?.college || ""),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        
        const snapshot = await getDocs(postsQuery);
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        })) as Post[];
        
        setCollegePosts(posts);
      } catch (error) {
        console.error("Error loading college posts:", error);
      }
    };

    if (isMember || !user) {
      loadCollegePosts();
    }
  }, [currentCollegeId, isMember, userProfile, user]);

  // Load students from college
  useEffect(() => {
    const loadStudents = async () => {
      if (!currentCollegeId) return;

      try {
        const studentsQuery = query(
          collection(db, "users"),
          where("college", "==", userProfile?.college || ""),
          limit(8)
        );
        
        const snapshot = await getDocs(studentsQuery);
        const studentsData = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as Student[];
        
        setStudents(studentsData);
      } catch (error) {
        console.error("Error loading students:", error);
      }
    };

    loadStudents();
  }, [currentCollegeId, userProfile]);

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      if (!currentCollegeId) return;

      try {
        const eventsQuery = query(
          collection(db, "colleges", currentCollegeId, "events"),
          orderBy("date", "asc"),
          limit(10)
        );
        
        const snapshot = await getDocs(eventsQuery);
        const eventsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date(),
          attendees: doc.data().attendees || []
        })) as Event[];
        
        setEvents(eventsData);
      } catch (error) {
        console.error("Error loading events:", error);
      }
    };

    loadEvents();
  }, [currentCollegeId]);

  // Load top creators
  useEffect(() => {
    const loadTopCreators = async () => {
      if (!currentCollegeId) return;

      try {
        // Query users from same college, sorted by posts count
        const creatorsQuery = query(
          collection(db, "users"),
          where("college", "==", userProfile?.college || ""),
          limit(5)
        );
        
        const snapshot = await getDocs(creatorsQuery);
        const creators = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            name: data.displayName || "Unknown",
            posts: data.postsCount || 0,
            followers: data.followersCount || 0
          };
        }).sort((a, b) => b.posts - a.posts);
        
        setTopCreators(creators);
      } catch (error) {
        console.error("Error loading top creators:", error);
      }
    };

    loadTopCreators();
  }, [currentCollegeId, userProfile]);

  // Join/Leave college community
  const handleJoinToggle = async () => {
    if (!user || !college) return;

    setJoiningLoading(true);
    try {
      const memberRef = doc(db, "colleges", college.id, "members", user.uid);
      
      if (isMember) {
        // Leave community
        await deleteDoc(memberRef);
        await updateDoc(doc(db, "colleges", college.id), {
          membersCount: increment(-1)
        });
        
        setIsMember(false);
        setCollege(prev => prev ? { ...prev, membersCount: prev.membersCount - 1 } : null);
        toast.success("Left community");
      } else {
        // Join community
        await setDoc(memberRef, {
          joinedAt: serverTimestamp(),
          role: "member"
        });
        await updateDoc(doc(db, "colleges", college.id), {
          membersCount: increment(1)
        });
        
        // Update user's college list
        await updateDoc(doc(db, "users", user.uid), {
          colleges: arrayUnion(college.id)
        });
        
        setIsMember(true);
        setCollege(prev => prev ? { ...prev, membersCount: prev.membersCount + 1 } : null);
        toast.success(`Joined ${college.name}!`);
        
        // Track college joined event
        trackCollegeJoined(user.uid, college.id, college.name);
        setShowWelcomeBanner(true);
      }
    } catch (error) {
      console.error("Error toggling membership:", error);
      toast.error(isMember ? "Failed to leave community" : "Failed to join community");
    } finally {
      setJoiningLoading(false);
    }
  };

  // RSVP to event
  const handleRSVP = async (eventId: string) => {
    if (!user || !college) return;

    try {
      const eventRef = doc(db, "colleges", college.id, "events", eventId);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) return;
      
      const attendees = eventDoc.data().attendees || [];
      const isAttending = attendees.includes(user.uid);
      
      if (isAttending) {
        await updateDoc(eventRef, {
          attendees: arrayRemove(user.uid)
        });
        toast.success("RSVP cancelled");
      } else {
        await updateDoc(eventRef, {
          attendees: arrayUnion(user.uid)
        });
        toast.success("RSVP confirmed!");
      }
      
      // Refresh events
      const updatedEvents = events.map(event => {
        if (event.id === eventId) {
          const newAttendees = isAttending 
            ? event.attendees.filter(id => id !== user.uid)
            : [...event.attendees, user.uid];
          return { ...event, attendees: newAttendees };
        }
        return event;
      });
      setEvents(updatedEvents);
    } catch (error) {
      console.error("Error handling RSVP:", error);
      toast.error("Failed to RSVP");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6F91]"></div>
      </div>
    );
  }

  if (!college) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h3 className="mb-2">College Not Found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please update your college in profile settings
          </p>
          <Button onClick={() => navigate("/settings")}>
            Go to Settings
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/feed")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Button>

        {/* College Header */}
        <div className="relative">
          <div className="h-64 rounded-2xl overflow-hidden">
            <ImageWithFallback
              src={college.banner}
              alt={college.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          </div>
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-4xl mb-2">{college.name}</h1>
            <p className="text-xl bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
              {college.hashtag}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-8 text-center">
          <div>
            <p className="text-2xl">{college.membersCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Members</p>
          </div>
          <div>
            <p className="text-2xl">{college.postsCount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Posts</p>
          </div>
          <Button 
            className="ml-auto bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
            onClick={handleJoinToggle}
            disabled={joiningLoading}
          >
            {joiningLoading ? "..." : isMember ? "Leave Community" : "Join Community"}
          </Button>
        </div>

        {/* Content Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="feed" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="feed">Feed</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="recruiters">Recruiters</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="space-y-4 mt-6">
                {!isMember && user ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">
                        Join the community to see posts from {college.name}
                      </p>
                    </CardContent>
                  </Card>
                ) : collegePosts.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">
                        No posts yet. Be the first to post!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  collegePosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      currentUserId={user?.uid || ""}
                      currentUserName={user?.displayName || "User"}
                      currentUserAvatar={user?.photoURL}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="students" className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  {students.length === 0 ? (
                    <Card className="col-span-2">
                      <CardContent className="p-6 text-center">
                        <p className="text-muted-foreground">No students found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    students.map((student) => (
                      <Card key={student.uid}>
                        <CardContent className="p-4 text-center space-y-3">
                          <Avatar className="h-16 w-16 mx-auto">
                            <AvatarImage src={student.photoURL} />
                            <AvatarFallback>{student.displayName?.[0]?.toUpperCase() || "S"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p>{student.displayName || "Student"}</p>
                            <p className="text-xs text-muted-foreground">{student.major || "Unknown Major"}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="w-full"
                            onClick={() => toast.info("Connection feature coming soon")}
                          >
                            Connect
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="recruiters" className="space-y-4 mt-6">
                <p className="text-muted-foreground">Companies recruiting from {college.name}</p>
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No upcoming recruiters. Check back later!
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="events" className="space-y-4 mt-6">
                {events.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">
                        No upcoming events. Check back later!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  events.map((event) => {
                    const isAttending = user ? event.attendees.includes(user.uid) : false;
                    const month = event.date.toLocaleString('en', { month: 'short' }).toUpperCase();
                    const day = event.date.getDate();
                    
                    return (
                      <Card key={event.id}>
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-[#FFB88C] to-[#FF6F91] rounded-lg flex flex-col items-center justify-center text-white">
                              <p className="text-xs">{month}</p>
                              <p className="text-2xl">{day}</p>
                            </div>
                            <div className="flex-1">
                              <h4>{event.title}</h4>
                              <p className="text-sm text-muted-foreground mb-2">
                                {event.location} • {event.date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="h-4 w-4" />
                                <span>{event.attendees.length} attending</span>
                              </div>
                            </div>
                            <Button 
                              variant={isAttending ? "default" : "outline"}
                              onClick={() => handleRSVP(event.id)}
                            >
                              {isAttending ? "Attending" : "RSVP"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-4">Top Creators</h3>
                <div className="space-y-3">
                  {topCreators.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No creators yet
                    </p>
                  ) : (
                    topCreators.map((creator, i) => (
                      <div key={creator.uid} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] rounded-full flex items-center justify-center text-white">
                            {i + 1}
                          </div>
                          <div>
                            <p className="text-sm">{creator.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {creator.posts} posts
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {creator.followers > 1000 
                            ? `${(creator.followers / 1000).toFixed(1)}k` 
                            : creator.followers}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#FF6F91]" />
                  <h4>Upcoming Events</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Don't miss out on exciting events happening at your college
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  View All Events
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Welcome Banner */}
        {showWelcomeBanner && (
          <Card className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] text-white p-4 space-y-2">
            <CardContent className="flex items-center gap-4">
              <PartyPopper className="h-6 w-6" />
              <p className="text-sm">
                Welcome to {college.name}! Start connecting with fellow students and stay updated on campus events.
              </p>
            </CardContent>
            <Button
              size="sm"
              variant="outline"
              className="text-white"
              onClick={() => setShowWelcomeBanner(false)}
            >
              Close
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}