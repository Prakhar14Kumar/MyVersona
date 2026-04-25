import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  User, MapPin, Calendar, Briefcase, GraduationCap, 
  Settings, Share2, MessageCircle, UserPlus, UserCheck,
  Edit, Camera, Loader2, Link as LinkIcon, Instagram, 
  Linkedin, Github, Award, TrendingUp
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PostCard } from './PostCard';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner@2.0.3';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Post, UserProfile } from '../types';

export function ProfilePage() {
  const { userId } = useParams<{ userId?: string }>();
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Determine if viewing own profile or another user's profile
  const isOwnProfile = !userId || userId === user?.uid;
  const profileUserId = isOwnProfile ? user?.uid : userId;

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!profileUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // If viewing own profile, use userProfile from context
        if (isOwnProfile && userProfile) {
          setProfile(userProfile);
        } else {
          // Load other user's profile from Firestore
          const profileDoc = await getDoc(doc(db, 'users', profileUserId));
          if (profileDoc.exists()) {
            setProfile({ uid: profileDoc.id, ...profileDoc.data() } as UserProfile);
          } else {
            toast.error('User not found');
            navigate('/feed');
            return;
          }
        }

        // Load user's posts
        const postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', profileUserId),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        const postsSnapshot = await getDocs(postsQuery);
        const userPosts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        setPosts(userPosts);

        // Check if current user is following this profile
        if (!isOwnProfile && user?.uid && userProfile) {
          setFollowing(userProfile.following?.includes(profileUserId) || false);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [profileUserId, isOwnProfile, userProfile, user?.uid, navigate]);

  // Handle follow/unfollow
  const handleFollowToggle = async () => {
    if (!user?.uid || !profileUserId || isOwnProfile) return;

    try {
      setFollowLoading(true);

      if (following) {
        // Unfollow
        await updateDoc(doc(db, 'users', user.uid), {
          following: arrayRemove(profileUserId),
          followingCount: increment(-1)
        });
        await updateDoc(doc(db, 'users', profileUserId), {
          followers: arrayRemove(user.uid),
          followersCount: increment(-1)
        });
        setFollowing(false);
        toast.success('Unfollowed');
      } else {
        // Follow
        await updateDoc(doc(db, 'users', user.uid), {
          following: arrayUnion(profileUserId),
          followingCount: increment(1)
        });
        await updateDoc(doc(db, 'users', profileUserId), {
          followers: arrayUnion(user.uid),
          followersCount: increment(1)
        });
        setFollowing(true);
        toast.success('Following');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  // Handle message
  const handleMessage = async () => {
    if (!user?.uid || !profileUserId) return;
    try {
      // Find existing chat
      const chatsRef = collection(db, 'chats');
      const q = query(chatsRef, where('participants', 'array-contains', user.uid));
      const snapshot = await getDocs(q);
      
      let existingChatId = null;
      for (const docSnap of snapshot.docs) {
        const participants = docSnap.data().participants || [];
        if (participants.includes(profileUserId)) {
          existingChatId = docSnap.id;
          break;
        }
      }

      if (existingChatId) {
        navigate('/chat', { state: { chatId: existingChatId } });
      } else {
        // Create new chat
        const newChatRef = await addDoc(collection(db, 'chats'), {
          participants: [user.uid, profileUserId],
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          lastMessage: '',
          chat_type: 'casual'
        });
        navigate('/chat', { state: { chatId: newChatRef.id } });
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start conversation');
    }
  };

  // Handle share profile
  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/profile/${profileUserId}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${profile?.displayName || 'User'}'s Profile on MyVerSona`,
          url: profileUrl
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success('Profile link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6F91]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <User className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
        <p className="text-gray-600 mb-4">This profile doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/feed')}>Go to Feed</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Cover Image */}
      <div className="w-full h-48 bg-gradient-to-r from-[#FF6F91] via-[#FFB88C] to-[#6DE7C5]" />

      {/* Profile Header */}
      <div className="max-w-4xl mx-auto px-4 -mt-20">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-xl">
                <AvatarImage src={profile.photoURL} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-[#FF6F91] to-[#FFB88C] text-white">
                  {profile.displayName?.[0] || profile.email?.[0] || 'U'}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute bottom-0 right-0 rounded-full w-10 h-10 p-0"
                  onClick={() => navigate('/settings')}
                >
                  <Camera className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    {profile.displayName}
                    {profile.is_verified_user && (
                      <Badge className="bg-[#FF6F91]">Verified</Badge>
                    )}
                  </h1>
                  <p className="text-gray-600">@{profile.username || profile.email?.split('@')[0]}</p>
                </div>

                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button
                      variant="outline"
                      onClick={() => navigate('/settings')}
                      className="gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className="gap-2"
                        variant={following ? 'outline' : 'default'}
                      >
                        {followLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : following ? (
                          <>
                            <UserCheck className="w-4 h-4" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Follow
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleMessage}
                        className="gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex gap-6 mb-4">
                <div className="text-center">
                  <div className="font-bold text-xl">{posts.length}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </div>
                <div className="text-center cursor-pointer hover:text-[#FF6F91]">
                  <div className="font-bold text-xl">{profile.followersCount || 0}</div>
                  <div className="text-sm text-gray-600">Followers</div>
                </div>
                <div className="text-center cursor-pointer hover:text-[#FF6F91]">
                  <div className="font-bold text-xl">{profile.followingCount || 0}</div>
                  <div className="text-sm text-gray-600">Following</div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {profile.college && (
                  <div className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4" />
                    {profile.college}
                  </div>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {profile.location}
                  </div>
                )}
                {profile.createdAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skills & Interests */}
          {(profile.skills?.length > 0 || profile.interests?.length > 0) && (
            <div className="mt-6 pt-6 border-t">
              {profile.skills?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="bg-[#6DE7C5]/10 border-[#6DE7C5]">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile.interests?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest, idx) => (
                      <Badge key={idx} variant="outline" className="bg-[#FFB88C]/10 border-[#FFB88C]">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-6">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-600 text-center">
                    {isOwnProfile ? "You haven't posted anything yet" : "No posts yet"}
                  </p>
                  {isOwnProfile && (
                    <Button onClick={() => navigate('/feed')} className="mt-4">
                      Create Your First Post
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard 
                    key={post.id} 
                    post={post}
                    currentUserId={user?.uid || ""}
                    currentUserName={user?.displayName || "User"}
                    currentUserAvatar={userProfile?.photoURL || undefined}
                    onNavigate={(page) => navigate(`/${page}`)} 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.bio && (
                  <div>
                    <h4 className="font-semibold mb-2">Bio</h4>
                    <p className="text-gray-700">{profile.bio}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    {profile.college && (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span>Studies at {profile.college}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>Lives in {profile.location}</span>
                      </div>
                    )}
                    {profile.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
