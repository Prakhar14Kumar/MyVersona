import { useState, useEffect } from 'react';
import { TrendingUp, Users, Briefcase, Award, Target, Zap, ArrowUp, ArrowDown, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { toast } from 'sonner';

interface GrowthDashboardProps {
  onNavigate?: (page: string) => void;
}

interface GrowthMetrics {
  profileViews: { current: number; change: number; trending: string };
  connections: { current: number; change: number; trending: string };
  postEngagement: { current: number; change: number; trending: string };
  careerScore: { current: number; target: number };
}

interface Milestone {
  title: string;
  completed: boolean;
  points: number;
  description: string;
  progress?: number;
}

export function GrowthDashboard({ onNavigate }: GrowthDashboardProps) {
  const { user, userProfile } = useAuth();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics>({
    profileViews: { current: 0, change: 0, trending: 'up' },
    connections: { current: 0, change: 0, trending: 'up' },
    postEngagement: { current: 0, change: 0, trending: 'up' },
    careerScore: { current: 0, target: 100 },
  });
  
  const [careerMilestones, setCareerMilestones] = useState<Milestone[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<any[]>([]);

  // Load real analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      if (!user || !userProfile) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Calculate real metrics from user profile and Firestore
        
        // 1. Profile Views (from analytics collection if exists, otherwise from profile)
        const profileViewsCount = userProfile.profileViewsCount || 0;
        
        // 2. Connections count
        const connectionsCount = userProfile.followersCount || 0;
        
        // 3. Post Engagement (calculate from user's posts)
        const postsQuery = query(
          collection(db, 'posts'),
          where('userId', '==', user.uid)
        );
        const postsSnapshot = await getDocs(postsQuery);
        const posts = postsSnapshot.docs.map(doc => doc.data());
        
        const totalLikes = posts.reduce((sum, post) => sum + (post.likes || 0), 0);
        const totalComments = posts.reduce((sum, post) => sum + (post.comments || 0), 0);
        const totalPosts = posts.length;
        const engagementRate = totalPosts > 0 
          ? ((totalLikes + totalComments) / totalPosts) 
          : 0;
        
        // 4. Calculate career score based on profile completeness
        let careerScore = 0;
        if (userProfile.photoURL) careerScore += 10;
        if (userProfile.bio) careerScore += 10;
        if (userProfile.college) careerScore += 10;
        if (userProfile.skills && userProfile.skills.length > 0) careerScore += 15;
        if (userProfile.resumeUrl) careerScore += 15;
        if (totalPosts > 0) careerScore += 10;
        if (connectionsCount >= 10) careerScore += 15;
        if (connectionsCount >= 50) careerScore += 15;
        
        setGrowthMetrics({
          profileViews: {
            current: profileViewsCount,
            change: 0, // Would calculate from historical data
            trending: 'up'
          },
          connections: {
            current: connectionsCount,
            change: 0,
            trending: 'up'
          },
          postEngagement: {
            current: Math.round(engagementRate),
            change: 0,
            trending: engagementRate > 10 ? 'up' : 'down'
          },
          careerScore: {
            current: careerScore,
            target: 100
          }
        });
        
        // Calculate milestones
        const milestones: Milestone[] = [
          {
            title: 'Complete Your Profile',
            completed: !!(userProfile.photoURL && userProfile.bio && userProfile.college),
            points: 100,
            description: 'Add photo, bio, and college info'
          },
          {
            title: 'Upload Resume',
            completed: !!userProfile.resumeUrl,
            points: 50,
            description: userProfile.resumeUrl ? 'Resume uploaded!' : 'Let AI analyze your resume'
          },
          {
            title: 'Connect with 50 Peers',
            completed: connectionsCount >= 50,
            progress: Math.min(connectionsCount, 50),
            points: 150,
            description: `${connectionsCount}/50 connections made`
          },
          {
            title: 'Create 10 Posts',
            completed: totalPosts >= 10,
            progress: Math.min(totalPosts, 10),
            points: 200,
            description: `${totalPosts}/10 posts created`
          },
          {
            title: 'Get 100 Profile Views',
            completed: profileViewsCount >= 100,
            progress: Math.min(profileViewsCount, 100),
            points: 100,
            description: `${profileViewsCount}/100 profile views`
          },
        ];
        
        setCareerMilestones(milestones);
        
        // Load recent achievements (from achievements collection if exists)
        try {
          const achievementsQuery = query(
            collection(db, 'users', user.uid, 'achievements'),
            orderBy('achievedAt', 'desc'),
            limit(5)
          );
          const achievementsSnapshot = await getDocs(achievementsQuery);
          
          if (achievementsSnapshot.empty) {
            // Generate from completed milestones
            const completed = milestones.filter(m => m.completed);
            setRecentAchievements(
              completed.slice(0, 3).map(m => ({
                icon: '🎯',
                title: m.title,
                date: 'Recently',
                points: `+${m.points} points`
              }))
            );
          } else {
            const achievements = achievementsSnapshot.docs.map(doc => {
              const data = doc.data();
              return {
                icon: data.icon || '🎯',
                title: data.title,
                date: data.achievedAt?.toDate().toLocaleDateString() || 'Recently',
                points: `+${data.points || 0} points`
              };
            });
            setRecentAchievements(achievements);
          }
        } catch (error) {
          console.error('Error loading achievements:', error);
          setRecentAchievements([]);
        }
        
        // Generate weekly goals based on current activity
        setWeeklyGoals([
          {
            goal: 'Post 3 times',
            progress: Math.min(totalPosts % 3, 3),
            target: 3
          },
          {
            goal: 'Make 5 connections',
            progress: Math.min(connectionsCount % 5, 5),
            target: 5
          },
          {
            goal: 'Get 50 engagements',
            progress: Math.min((totalLikes + totalComments) % 50, 50),
            target: 50
          }
        ]);
        
      } catch (error) {
        console.error('Error loading analytics:', error);
        toast.error('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [user, userProfile, timeRange]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6F91]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 px-6 pb-12">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2">
              Your Growth Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your progress and achieve your career goals
            </p>
          </div>
          <Button
            onClick={() => onNavigate?.('feed')}
            variant="outline"
          >
            Back to Feed
          </Button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={timeRange === 'week' ? 'default' : 'outline'}
            onClick={() => setTimeRange('week')}
            className={timeRange === 'week' ? 'bg-gradient-to-r from-[#FFB88C] to-[#FF6F91]' : ''}
          >
            This Week
          </Button>
          <Button
            size="sm"
            variant={timeRange === 'month' ? 'default' : 'outline'}
            onClick={() => setTimeRange('month')}
            className={timeRange === 'month' ? 'bg-gradient-to-r from-[#FFB88C] to-[#FF6F91]' : ''}
          >
            This Month
          </Button>
          <Button
            size="sm"
            variant={timeRange === 'year' ? 'default' : 'outline'}
            onClick={() => setTimeRange('year')}
            className={timeRange === 'year' ? 'bg-gradient-to-r from-[#FFB88C] to-[#FF6F91]' : ''}
          >
            This Year
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Profile Views */}
          <Card className="border-2 hover:border-[#FFB88C] transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <Badge variant={growthMetrics.profileViews.trending === 'up' ? 'default' : 'secondary'} className="gap-1">
                  <ArrowUp className="w-3 h-3" />
                  {growthMetrics.profileViews.change}%
                </Badge>
              </div>
              <div className="text-2xl mb-1">{growthMetrics.profileViews.current}</div>
              <div className="text-sm text-muted-foreground">Profile Views</div>
            </CardContent>
          </Card>

          {/* Connections */}
          <Card className="border-2 hover:border-[#FF6F91] transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FF6F91] to-[#6DE7C5] flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <Badge variant="default" className="gap-1 bg-green-500">
                  <ArrowUp className="w-3 h-3" />
                  {growthMetrics.connections.change}%
                </Badge>
              </div>
              <div className="text-2xl mb-1">{growthMetrics.connections.current}</div>
              <div className="text-sm text-muted-foreground">Connections</div>
            </CardContent>
          </Card>

          {/* Engagement */}
          <Card className="border-2 hover:border-[#6DE7C5] transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#6DE7C5] to-[#FFB88C] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <Badge variant="secondary" className="gap-1">
                  <ArrowDown className="w-3 h-3" />
                  {Math.abs(growthMetrics.postEngagement.change)}%
                </Badge>
              </div>
              <div className="text-2xl mb-1">{growthMetrics.postEngagement.current}%</div>
              <div className="text-sm text-muted-foreground">Engagement Rate</div>
            </CardContent>
          </Card>

          {/* Career Score */}
          <Card className="border-2 hover:border-[#FFB88C] transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <Badge variant="default" className="bg-gradient-to-r from-[#FFB88C] to-[#FF6F91]">
                  {growthMetrics.careerScore.current}/{growthMetrics.careerScore.target}
                </Badge>
              </div>
              <div className="text-2xl mb-1">{growthMetrics.careerScore.current}%</div>
              <div className="text-sm text-muted-foreground">Career Readiness</div>
            </CardContent>
          </Card>
        </div>

        {/* Career Milestones & Weekly Goals */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Career Milestones */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle>Career Milestones</CardTitle>
                  <CardDescription>Complete tasks to boost your profile</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {careerMilestones.map((milestone, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border ${milestone.completed ? 'bg-green-50 border-green-200' : 'bg-muted/50 border-border'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        milestone.completed ? 'bg-green-500' : 'bg-muted'
                      }`}>
                        {milestone.completed ? (
                          <span className="text-white text-xs">✓</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                            {milestone.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{milestone.description}</p>
                        {!milestone.completed && milestone.progress !== undefined && (
                          <div className="mt-2">
                            <Progress value={(milestone.progress / 10) * 100} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      +{milestone.points}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Weekly Goals */}
          <div className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FF6F91] to-[#6DE7C5] flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Weekly Goals</CardTitle>
                    <CardDescription>Stay on track this week</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {weeklyGoals.map((goal, index) => (
                  <div key={index} className="p-4 rounded-lg bg-muted/50 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span>{goal.goal}</span>
                      <Badge variant="outline">
                        {goal.progress}/{goal.target}
                      </Badge>
                    </div>
                    <Progress value={(goal.progress / goal.target) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-base">Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-[#FFB88C]/5 to-[#FF6F91]/5 border border-[#FFB88C]/20">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="leading-tight">{achievement.title}</div>
                      <div className="text-xs text-muted-foreground">{achievement.date}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {achievement.points}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-2 hover:border-[#FFB88C] transition-all cursor-pointer" onClick={() => onNavigate?.('career')}>
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg mb-2">Browse Jobs</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Find opportunities that match your skills
              </p>
              <Button className="w-full bg-gradient-to-r from-[#FFB88C] to-[#FF6F91]">
                Explore Jobs
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#FF6F91] transition-all cursor-pointer" onClick={() => onNavigate?.('explore')}>
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#FF6F91] to-[#6DE7C5] flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg mb-2">Find Connections</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Network with peers and professionals
              </p>
              <Button className="w-full bg-gradient-to-r from-[#FF6F91] to-[#6DE7C5]">
                Discover People
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-[#6DE7C5] transition-all cursor-pointer" onClick={() => onNavigate?.('feed')}>
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#6DE7C5] to-[#FFB88C] flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg mb-2">Create Content</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Share your journey and grow your presence
              </p>
              <Button className="w-full bg-gradient-to-r from-[#6DE7C5] to-[#FFB88C]">
                Start Posting
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}