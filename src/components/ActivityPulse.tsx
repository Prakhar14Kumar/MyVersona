import { useState, useEffect } from 'react';
import { TrendingUp, Users, FileText, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';

interface Activity {
  type: 'new_post' | 'new_member' | 'trending_post';
  userName?: string;
  collegeName?: string;
  postContent?: string;
  likes?: number;
  memberCount?: number;
  timestamp: Date;
}

export function ActivityPulse() {
  const { user, userProfile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !userProfile?.college) {
      setLoading(false);
      return;
    }

    const loadActivities = async () => {
      try {
        const activityList: Activity[] = [];
        
        // 1. Get latest posts from college (last 5)
        const postsQuery = query(
          collection(db, 'posts'),
          where('userCollege', '==', userProfile.college),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const postsSnapshot = await getDocs(postsQuery);
        postsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userId !== user.uid) { // Don't show own posts
            activityList.push({
              type: 'new_post',
              userName: data.userName,
              collegeName: data.userCollege,
              postContent: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : ''),
              timestamp: data.createdAt?.toDate() || new Date(),
            });
          }
        });
        
        // 2. Get trending post (highest likes in last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const trendingQuery = query(
          collection(db, 'posts'),
          where('userCollege', '==', userProfile.college),
          orderBy('likes', 'desc'),
          limit(1)
        );
        
        const trendingSnapshot = await getDocs(trendingQuery);
        if (!trendingSnapshot.empty) {
          const topPost = trendingSnapshot.docs[0].data();
          if (topPost.likes > 10) {
            activityList.push({
              type: 'trending_post',
              userName: topPost.userName,
              likes: topPost.likes,
              collegeName: topPost.userCollege,
              timestamp: topPost.createdAt?.toDate() || new Date(),
            });
          }
        }
        
        // 3. Get college member count
        const collegeQuery = query(
          collection(db, 'colleges'),
          where('name', '==', userProfile.college)
        );
        const collegeSnapshot = await getDocs(collegeQuery);
        if (!collegeSnapshot.empty) {
          const collegeData = collegeSnapshot.docs[0].data();
          if (collegeData.membersCount > 0) {
            activityList.push({
              type: 'new_member',
              memberCount: collegeData.membersCount,
              collegeName: userProfile.college,
              timestamp: new Date(),
            });
          }
        }
        
        // Sort by timestamp and limit to 5
        activityList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setActivities(activityList.slice(0, 5));
      } catch (error) {
        console.error('Failed to load activities:', error);
      } finally {
        setLoading(false);
      }
    };

    loadActivities();
    
    // Set up real-time listener for new posts
    const postsQuery = query(
      collection(db, 'posts'),
      where('userCollege', '==', userProfile.college),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      const newActivities: Activity[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userId !== user.uid) {
          newActivities.push({
            type: 'new_post',
            userName: data.userName,
            collegeName: data.userCollege,
            postContent: data.content?.substring(0, 50) + (data.content?.length > 50 ? '...' : ''),
            timestamp: data.createdAt?.toDate() || new Date(),
          });
        }
      });
      if (newActivities.length > 0) {
        setActivities(prev => [...newActivities, ...prev].slice(0, 5));
      }
    });
    
    return () => unsubscribe();
  }, [user, userProfile]);

  if (loading || !userProfile?.college) {
    return null;
  }

  if (activities.length === 0) {
    return null;
  }

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'new_post':
        return <FileText className="w-4 h-4" />;
      case 'new_member':
        return <Users className="w-4 h-4" />;
      case 'trending_post':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'new_post':
        return `${activity.userName} posted in ${activity.collegeName}`;
      case 'new_member':
        return `${activity.memberCount} students in your college`;
      case 'trending_post':
        return `${activity.userName}'s post got ${activity.likes} likes 🔥`;
      default:
        return 'New activity';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card className="border-l-4 border-l-[#FF6F91]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#FF6F91]" />
          What's happening in your college
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFB88C] to-[#FF6F91] flex items-center justify-center text-white flex-shrink-0">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{getActivityText(activity)}</p>
              {activity.postContent && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  "{activity.postContent}"
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimeAgo(activity.timestamp)}
              </p>
            </div>
            {activity.type === 'trending_post' && (
              <Badge variant="secondary" className="flex-shrink-0">
                Trending
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
