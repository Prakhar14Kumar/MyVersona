import { useState } from "react";
import { Home, Compass, School, MessageCircle, Settings, Brain, TrendingUp, FileText, Users2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { AICareerAssistant } from "./AICareerAssistant";
import { ResumeUpload } from "./ResumeUpload";
import { Badge } from "./ui/badge";
import versonaLogo from "figma:asset/ef2e50ad7a151d7b9c86737646c4bf1acd9e7285.png";
import { useAuth } from "../hooks/useAuth";

interface CareerPageProps {
  onNavigate: (page: string) => void;
}

export function CareerPage({ onNavigate }: CareerPageProps) {
  const { user, userProfile } = useAuth();
  const [activePage, setActivePage] = useState("career");
  const [activeTab, setActiveTab] = useState("recommendations");

  const sidebarItems = [
    { icon: Home, label: "Home", id: "home" },
    { icon: Compass, label: "Explore", id: "explore" },
    { icon: School, label: "College", id: "college" },
    { icon: Brain, label: "AI Career", id: "career" },
    { icon: MessageCircle, label: "Messages", id: "messages" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-border fixed left-0 top-0 h-full flex flex-col shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <img src={versonaLogo} alt="VerSona" className="h-8 w-auto" />
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
                  if (item.id === "explore") onNavigate("explore");
                  if (item.id === "college") onNavigate("college");
                  if (item.id === "messages") onNavigate("chat");
                  if (item.id === "settings") onNavigate("settings");
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 text-[#FF6F91]"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>🇮🇳</span>
            <span>Made in India</span>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onNavigate("landing")}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <div className="container max-w-4xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FFB88C] to-[#FF6F91] flex items-center justify-center shadow-lg">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl flex items-center gap-2">
                  AI Career Assistant
                  <Badge className="bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Beta
                  </Badge>
                </h1>
                <p className="text-muted-foreground leading-relaxed">
                  Get personalized career guidance powered by machine learning
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="resume" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Resume Analysis
              </TabsTrigger>
              <TabsTrigger value="connections" className="flex items-center gap-2">
                <Users2 className="w-4 h-4" />
                Network
              </TabsTrigger>
            </TabsList>

            {/* Career Recommendations Tab */}
            <TabsContent value="recommendations" className="space-y-6 mt-6">
              <AICareerAssistant />
            </TabsContent>

            {/* Resume Analysis Tab */}
            <TabsContent value="resume" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#FF6F91]" />
                    AI Resume Analyzer
                  </CardTitle>
                  <CardDescription>
                    Upload your resume for AI-powered feedback and improvement suggestions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ResumeUpload />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Network Recommendations Tab */}
            <TabsContent value="connections" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users2 className="w-5 h-5 text-[#FF6F91]" />
                    Smart Connection Recommendations
                  </CardTitle>
                  <CardDescription>
                    ML-powered suggestions to expand your professional network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        name: "Rahul Sharma",
                        college: "IIT Bombay",
                        role: "Software Engineer @ Google",
                        mutual: 12,
                        match: 91
                      },
                      {
                        name: "Priya Patel",
                        college: "IIT Delhi",
                        role: "Product Manager @ Microsoft",
                        mutual: 8,
                        match: 87
                      },
                      {
                        name: "Arjun Mehta",
                        college: "BITS Pilani",
                        role: "Data Scientist @ Amazon",
                        mutual: 15,
                        match: 83
                      }
                    ].map((person) => (
                      <div key={person.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`https://via.placeholder.com/100/FF6F91/FFFFFF?text=${person.name[0]}`} />
                            <AvatarFallback>{person.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="flex items-center gap-2">
                              {person.name}
                              <Badge variant="secondary" className="text-xs">
                                {person.match}% match
                              </Badge>
                            </p>
                            <p className="text-sm text-muted-foreground">{person.role}</p>
                            <p className="text-xs text-muted-foreground">
                              {person.college} • {person.mutual} mutual connections
                            </p>
                          </div>
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] hover:opacity-90">
                          Connect
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* ML Info Footer */}
          <Card className="bg-gradient-to-br from-[#FFB88C]/5 via-[#FF6F91]/5 to-[#6DE7C5]/5 border-[#FF6F91]/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6DE7C5] to-[#FFB88C] flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2">
                  <h4 className="flex items-center gap-2">
                    Powered by Advanced Machine Learning
                    <Badge variant="outline" className="border-[#FF6F91]/30">Python ML</Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Our AI Career Assistant uses state-of-the-art machine learning models including 
                    BERT for natural language processing, collaborative filtering for personalized 
                    recommendations, and advanced algorithms for career path analysis. The system 
                    continuously learns from thousands of successful career trajectories to provide 
                    you with the most relevant guidance.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Badge variant="secondary" className="text-xs">TensorFlow</Badge>
                    <Badge variant="secondary" className="text-xs">BERT NLP</Badge>
                    <Badge variant="secondary" className="text-xs">Collaborative Filtering</Badge>
                    <Badge variant="secondary" className="text-xs">scikit-learn</Badge>
                    <Badge variant="secondary" className="text-xs">Python ML Backend</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}