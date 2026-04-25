import { Sparkles, Repeat2, MessageSquare, Brain, Users, TrendingUp, Briefcase, GraduationCap, Award, Zap, ChevronRight, Check, Heart } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { TrustBadges } from "./TrustBadges";
import { useNavigate } from "react-router";
import { Hexagon } from "lucide-react";
import coreTeamImg from "../assets/Core_team.png";

// We now use the permanent image logo from public/logo.jpg

export function LandingPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <img src="/logo.jpg" alt="MyVerSona Logo" className="w-10 h-10 object-cover rounded-xl shadow-lg" />
              <span className="text-2xl font-bold bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">MyVerSona</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/login")}
              >
                Sign In
              </Button>
              <Button
                className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90 transition-opacity"
                onClick={() => navigate("/signup")}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFB88C]/5 via-[#FF6F91]/5 to-[#6DE7C5]/5"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#FFB88C] rounded-full blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#6DE7C5] rounded-full blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FFB88C]/20 via-[#FF6F91]/20 to-[#6DE7C5]/20 rounded-full border border-[#FF6F91]/20">
                <div className="w-2 h-2 bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] rounded-full animate-pulse"></div>
                <span className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
                  Made in India 🇮🇳 • For Students, By Students
                </span>
              </div>
              
              {/* Headline */}
              <h1 className="text-5xl lg:text-7xl leading-tight tracking-tight">
                Where{" "}
                <span className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
                  Entertainment
                </span>
                {" "}Meets{" "}
                <span className="bg-gradient-to-r from-[#6DE7C5] via-[#FF6F91] to-[#FFB88C] bg-clip-text text-transparent">
                  Opportunity
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl">
                Join 10,000+ students already getting placements, making friends, and building their future.
              </p>
              
              {/* Instant Value Badges - NEW */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-border">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-muted-foreground">Avg. Time to First Connection</div>
                    <div className="text-lg">2 Minutes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-border">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm">📊</span>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-muted-foreground">Placement Success Rate</div>
                    <div className="text-lg">85%</div>
                  </div>
                </div>
              </div>
              
              {/* Tagline & Vision */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#FF6F91]/30 to-transparent"></div>
                  <p className="text-lg lg:text-xl bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent font-medium">
                    All under one SKY
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#FF6F91]/30 to-transparent"></div>
                </div>
                <p className="text-base lg:text-lg text-muted-foreground italic text-center">
                  ✨ Yahan Dosti Bhi, Growth Bhi. ✨
                </p>
              </div>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl">10K+</div>
                    <div className="text-sm text-muted-foreground">Students</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#FF6F91] to-[#6DE7C5] flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl">500+</div>
                    <div className="text-sm text-muted-foreground">Colleges</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#6DE7C5] to-[#FFB88C] flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl">200+</div>
                    <div className="text-sm text-muted-foreground">Recruiters</div>
                  </div>
                </div>
              </div>
              
              {/* CTAs */}
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90 transition-all hover:scale-105 duration-200 shadow-lg"
                  onClick={() => navigate("/signup")}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Join MyVerSona Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 hover:border-[#FF6F91] transition-colors"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] p-1 rounded-3xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1520410973988-f551cf36c60d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudHMlMjBwaG9uZSUyMGFwcHxlbnwxfHx8fDE3NjEwMzY4NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="MyVerSona App Preview"
                  className="rounded-3xl shadow-2xl w-full h-auto object-cover"
                />
              </div>
              {/* Floating Badges */}
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-lg p-4 border border-border animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Career Growth</div>
                    <div>+85% Match</div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-4 border border-border animate-bounce" style={{ animationDelay: '1.5s', animationDuration: '3s' }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF6F91] to-[#6DE7C5] flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Engagement</div>
                    <div>Active Now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security Section */}
      <TrustBadges variant="section" showStats={true} />

      {/* Dual Feed Showcase */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="mb-2 bg-gradient-to-r from-[#FFB88C]/20 via-[#FF6F91]/20 to-[#6DE7C5]/20 text-[#FF6F91] border-[#FF6F91]/20">
              The Power of Two Feeds
            </Badge>
            <h2 className="text-4xl lg:text-5xl tracking-tight">
              One App,{" "}
              <span className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
                Two Worlds
              </span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Seamlessly switch between entertainment and career content. No more juggling multiple apps.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Entertainment Feed */}
            <Card className="border-2 hover:border-[#FFB88C] transition-all hover:shadow-xl group">
              <CardHeader className="space-y-3 pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl leading-tight">🎭 Entertainment Feed</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Your fun zone for memes, campus life, events, and connecting with friends
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 pt-0">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FFB88C] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Campus memes & trends</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FFB88C] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">College events & parties</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FFB88C] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Casual chats with friends</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#FFB88C] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Fun hashtags & challenges</span>
                </div>
              </CardContent>
            </Card>

            {/* Career Feed */}
            <Card className="border-2 hover:border-[#6DE7C5] transition-all hover:shadow-xl group">
              <CardHeader className="space-y-3 pb-4">
                <div className="w-14 h-14 bg-gradient-to-r from-[#FF6F91] to-[#6DE7C5] rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Briefcase className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-2xl leading-tight">💼 Career Feed</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Your professional space for opportunities, networking, and growth
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5 pt-0">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#6DE7C5] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Job postings & internships</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#6DE7C5] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Network with recruiters</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#6DE7C5] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Professional content & tips</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-[#6DE7C5] flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">AI Career Assistant</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Toggle Indicator */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 px-6 py-3 rounded-full">
              <Repeat2 className="w-5 h-5 text-[#FF6F91]" />
              <span className="text-muted-foreground">Switch between feeds with one tap</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#FFB88C]/5 via-[#FF6F91]/5 to-[#6DE7C5]/5">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="mb-2 bg-gradient-to-r from-[#FFB88C]/20 via-[#FF6F91]/20 to-[#6DE7C5]/20 text-[#FF6F91] border-[#FF6F91]/20">
              Everything You Need
            </Badge>
            <h2 className="text-4xl lg:text-5xl tracking-tight">
              Built for{" "}
              <span className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
                Modern Students
              </span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              All the features you need to balance social life and career growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-2 hover:border-[#FF6F91] transition-all hover:shadow-lg group">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="leading-tight">💬 Dual Chat Modes</CardTitle>
                <CardDescription className="leading-relaxed">
                  Separate casual and professional conversations. Stay fun with friends, professional with recruiters.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 hover:border-[#FF6F91] transition-all hover:shadow-lg group">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#FF6F91] to-[#6DE7C5] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="leading-tight">🧠 AI Career Assistant</CardTitle>
                <CardDescription className="leading-relaxed">
                  Get personalized career advice, resume tips, and job recommendations powered by AI.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 hover:border-[#FF6F91] transition-all hover:shadow-lg group">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#6DE7C5] to-[#FFB88C] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="leading-tight">🎓 College Communities</CardTitle>
                <CardDescription className="leading-relaxed">
                  Connect with students from your college. Exclusive hashtags, events, and networking.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 hover:border-[#FF6F91] transition-all hover:shadow-lg group">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="leading-tight">📈 Trending Content</CardTitle>
                <CardDescription className="leading-relaxed">
                  Discover what's hot in your college and across campuses. Never miss out on trends.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="border-2 hover:border-[#FF6F91] transition-all hover:shadow-lg group">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#FF6F91] to-[#6DE7C5] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="leading-tight">👥 Role-Based Networking</CardTitle>
                <CardDescription className="leading-relaxed">
                  Connect as a student, recruiter, or alumni. Find the right people for the right context.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="border-2 hover:border-[#FF6F91] transition-all hover:shadow-lg group">
              <CardHeader className="space-y-3">
                <div className="w-12 h-12 bg-gradient-to-r from-[#6DE7C5] to-[#FFB88C] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="leading-tight">🏆 Events & Opportunities</CardTitle>
                <CardDescription className="leading-relaxed">
                  Discover campus events, workshops, hackathons, and career fairs all in one place.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* College Community Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] rounded-3xl blur-2xl opacity-20"></div>
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1758270703939-76ec979cbc65?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaXZlcnNlJTIwY29sbGVnZSUyMHN0dWRlbnRzJTIwaGFwcHl8ZW58MXx8fHwxNzYxMDM2ODY2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="College Community"
                className="relative rounded-3xl shadow-2xl w-full h-auto"
              />
            </div>
            
            <div className="space-y-6 order-1 lg:order-2">
              <Badge className="bg-gradient-to-r from-[#FFB88C]/20 via-[#FF6F91]/20 to-[#6DE7C5]/20 text-[#FF6F91] border-[#FF6F91]/20">
                Your Campus, Digitized
              </Badge>
              
              <h2 className="text-4xl lg:text-5xl tracking-tight leading-tight">
                Your College, Your{" "}
                <span className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
                  Community
                </span>
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                Connect with students from your college, discover campus events, find study groups, and network with alumni and recruiters visiting your campus.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-[#FFB88C]/5 to-[#FF6F91]/5 border border-[#FFB88C]/20">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">#</span>
                  </div>
                  <div className="space-y-1">
                    <div className="leading-tight">College-Specific Hashtags</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      Follow #YourCollege to see posts from your campus community
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-[#FF6F91]/5 to-[#6DE7C5]/5 border border-[#FF6F91]/20">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FF6F91] to-[#6DE7C5] flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="leading-tight">Find Your People</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      Discover classmates, club members, and like-minded students
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-[#6DE7C5]/5 to-[#FFB88C]/5 border border-[#6DE7C5]/20">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#6DE7C5] to-[#FFB88C] flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <div className="leading-tight">Campus Recruiters</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      Connect with companies recruiting at your college
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-gradient-to-br from-[#FFB88C]/5 via-[#FF6F91]/5 to-[#6DE7C5]/5">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="mb-2 bg-gradient-to-r from-[#FFB88C]/20 via-[#FF6F91]/20 to-[#6DE7C5]/20 text-[#FF6F91] border-[#FF6F91]/20">
              Simple & Fast
            </Badge>
            <h2 className="text-4xl lg:text-5xl tracking-tight">
              Get Started in{" "}
              <span className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
                3 Easy Steps
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] rounded-2xl flex items-center justify-center mx-auto text-white text-2xl">
                1
              </div>
              <h3 className="text-2xl leading-tight">Sign Up</h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Create your account and select your college. Takes less than 2 minutes.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-[#FF6F91] to-[#6DE7C5] rounded-2xl flex items-center justify-center mx-auto text-white text-2xl">
                2
              </div>
              <h3 className="text-2xl leading-tight">Customize</h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Set your interests, choose your role, and personalize your feeds.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-[#6DE7C5] to-[#FFB88C] rounded-2xl flex items-center justify-center mx-auto text-white text-2xl">
                3
              </div>
              <h3 className="text-2xl leading-tight">Connect</h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Start posting, chatting, and growing your network immediately.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge className="mb-2 bg-gradient-to-r from-[#FFB88C]/20 via-[#FF6F91]/20 to-[#6DE7C5]/20 text-[#FF6F91] border-[#FF6F91]/20">
              Built by Students
            </Badge>
            <h2 className="text-4xl lg:text-5xl tracking-tight">
              Meet the{" "}
              <span className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
                Visionaries
              </span>
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Four passionate college students building the future of social networking for India's youth
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* Team Photo */}
            <div className="relative mb-12">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] p-1 rounded-3xl">
                <img 
                  src={coreTeamImg}
                  alt="MyVerSona Core Team - Built by Students, For Students" 
                  className="rounded-3xl shadow-2xl w-full h-auto object-cover"
                />
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl px-6 py-3 border border-border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-[#FF6F91] fill-[#FF6F91]" />
                    <span className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
                      Made with Love in India
                    </span>
                  </div>
                  <span className="text-2xl">🇮🇳</span>
                </div>
              </div>
            </div>

            {/* Team Description */}
            <div className="text-center space-y-6 mt-16">
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                We're not just building a platform – we're building a movement. A team of diverse talents bringing together 
                expertise in <span className="text-[#FFB88C]">technology</span>, <span className="text-[#FF6F91]">design</span>, 
                <span className="text-[#6DE7C5]"> AI/ML</span>, and <span className="text-[#FFB88C]">product development</span> to 
                create something truly special for India's youth.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FFB88C]/5 to-[#FF6F91]/5 border border-[#FFB88C]/20">
                  <div className="text-4xl mb-3">🎯</div>
                  <h3 className="text-xl mb-2">Our Mission</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Empower 200M+ Indian students with a platform that truly understands their needs
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#FF6F91]/5 to-[#6DE7C5]/5 border border-[#FF6F91]/20">
                  <div className="text-4xl mb-3">💡</div>
                  <h3 className="text-xl mb-2">Our Innovation</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    8 custom ML models, ISO-compliant architecture, enterprise-grade security
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#6DE7C5]/5 to-[#FFB88C]/5 border border-[#6DE7C5]/20">
                  <div className="text-4xl mb-3">🚀</div>
                  <h3 className="text-xl mb-2">Our Vision</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Become India's #1 platform for youth by 2030, powering 10M+ students
                  </p>
                </div>
              </div>

              <div className="pt-8">
                <p className="text-sm text-muted-foreground mb-4">
                  We understand college life because we live it. Every feature is crafted with real student needs in mind.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Badge variant="outline" className="px-4 py-2">Student-First Design</Badge>
                  <Badge variant="outline" className="px-4 py-2">Privacy by Default</Badge>
                  <Badge variant="outline" className="px-4 py-2">Community-Driven</Badge>
                  <Badge variant="outline" className="px-4 py-2">Made in India 🇮🇳</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] rounded-3xl p-12 lg:p-16 text-center text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl lg:text-5xl tracking-tight leading-tight">
                Ready to Transform Your College Experience?
              </h2>
              <p className="text-xl lg:text-2xl opacity-90 leading-relaxed max-w-2xl mx-auto">
                Join thousands of students already using MyVerSona to balance fun and career growth.
              </p>
              <div className="flex flex-wrap gap-4 justify-center pt-2">
                <Button
                  size="lg"
                  className="bg-white text-[#FF6F91] hover:bg-white/90 transition-all hover:scale-105 duration-200 shadow-xl"
                  onClick={() => navigate("/signup")}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10"
                  onClick={() => navigate("/login")}
                >
                  Already have an account?
                </Button>
              </div>
              <p className="text-sm opacity-75 leading-relaxed">
                No credit card required • Free forever • Made in India 🇮🇳
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t bg-background">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
                  MyVerSona
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Where Entertainment Meets Opportunity
              </p>
            </div>
            
            <div>
              <h4 className="mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4">Legal</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Made with ❤️ in India 🇮🇳 • © 2025 MyVerSona. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}