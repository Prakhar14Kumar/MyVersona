import { useState, useEffect } from "react";
import { Brain, Sparkles, TrendingUp, Target, BookOpen, Loader2, ChevronRight, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  getCareerRecommendations, 
  type CareerRecommendation 
} from "../lib/mlService";

export function AICareerAssistant() {
  const [recommendations, setRecommendations] = useState<CareerRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Simulate user profile (in production, fetch from Firebase)
      const userProfile = {
        skills: ["React", "TypeScript", "Node.js"],
        interests: ["Web Development", "AI/ML", "Startups"],
        education: "Computer Science Engineering",
        experience: "2 years"
      };

      const results = await getCareerRecommendations(userProfile);
      setRecommendations(results);
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 border-[#FF6F91]/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFB88C] to-[#FF6F91] flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                AI Career Assistant
                <Badge variant="secondary" className="bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  ML Powered
                </Badge>
              </CardTitle>
              <CardDescription className="leading-relaxed">
                Personalized career recommendations using machine learning
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF6F91] mx-auto" />
            <p className="text-muted-foreground">Analyzing your profile with AI...</p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {!loading && recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2">
              <Target className="w-5 h-5 text-[#FF6F91]" />
              Top Career Matches
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRecommendations}
              className="text-[#FF6F91] hover:text-[#FF6F91]"
            >
              Refresh
            </Button>
          </div>

          {recommendations.map((rec, index) => (
            <Card 
              key={rec.title}
              className="hover:shadow-md transition-all cursor-pointer border-l-4"
              style={{
                borderLeftColor: index === 0 ? '#FFB88C' : index === 1 ? '#FF6F91' : '#6DE7C5'
              }}
              onClick={() => setShowDetails(showDetails === rec.title ? null : rec.title)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{rec.title}</CardTitle>
                      {index === 0 && (
                        <Badge className="bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] text-white border-0">
                          Best Match
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Match Score:</span>
                      <Progress 
                        value={rec.match_score * 100} 
                        className="w-24 h-2"
                      />
                      <span className="text-sm font-medium text-[#FF6F91]">
                        {Math.round(rec.match_score * 100)}%
                      </span>
                    </div>
                  </div>
                  <ChevronRight 
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      showDetails === rec.title ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">{rec.description}</p>

                {showDetails === rec.title && (
                  <div className="space-y-4 pt-4 border-t">
                    {/* Skills Required */}
                    <div>
                      <h4 className="text-sm mb-2 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#FF6F91]" />
                        Skills Required
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {rec.skills_required.map((skill) => (
                          <Badge key={skill} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Growth & Salary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          Growth Potential
                        </div>
                        <p className="font-medium">{rec.growth_potential}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Award className="w-4 h-4" />
                          Average Salary
                        </div>
                        <p className="font-medium">{rec.avg_salary}</p>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
                    >
                      Explore Career Path
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ML Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6DE7C5] to-[#FFB88C] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm">Powered by Advanced ML</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Our recommendations use collaborative filtering, natural language processing (BERT), 
                and trend analysis to match you with the best career opportunities based on your 
                unique profile and market demand.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
