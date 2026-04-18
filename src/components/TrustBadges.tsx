import { Shield, CheckCircle, Award, Lock, Users, TrendingUp, Star } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface TrustBadgesProps {
  variant?: 'inline' | 'section';
  showStats?: boolean;
}

export function TrustBadges({ variant = 'inline', showStats = true }: TrustBadgesProps) {
  const trustMetrics = {
    verifiedColleges: 500,
    activeStudents: 10000,
    placementRate: 85,
    dataSecured: '256-bit',
    isoCompliant: 94.4,
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="gap-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                <Shield className="w-3 h-3" />
                ISO 27001
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>94.4% ISO Compliance - Enterprise-grade security</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                <Lock className="w-3 h-3" />
                Secure
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>256-bit encryption - Your data is protected</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="gap-1 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                <CheckCircle className="w-3 h-3" />
                Verified
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>500+ verified colleges on platform</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge className="gap-1 bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100">
                <Users className="w-3 h-3" />
                10K+ Students
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Join 10,000+ active students</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <section className="py-16 px-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full mb-4">
            <Shield className="w-4 h-4 text-green-700" />
            <span className="text-sm text-green-700">Trusted by Students Across India</span>
          </div>
          <h2 className="text-3xl lg:text-4xl mb-4">
            Your Trust,{' '}
            <span className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
              Our Priority
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with enterprise-grade security and privacy standards to keep your data safe
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* ISO Compliance */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-green-200 hover:border-green-400 transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl mb-2">{trustMetrics.isoCompliant}%</div>
            <div className="text-sm mb-2">ISO 27001 Compliant</div>
            <p className="text-xs text-muted-foreground">
              Enterprise-grade security framework protecting your data
            </p>
          </div>

          {/* Data Security */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200 hover:border-blue-400 transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl mb-2">{trustMetrics.dataSecured}</div>
            <div className="text-sm mb-2">Encryption Standard</div>
            <p className="text-xs text-muted-foreground">
              Bank-level encryption keeps your information private
            </p>
          </div>

          {/* Verified Colleges */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-200 hover:border-purple-400 transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-purple-400 to-purple-600 flex items-center justify-center mb-4">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl mb-2">{trustMetrics.verifiedColleges}+</div>
            <div className="text-sm mb-2">Verified Colleges</div>
            <p className="text-xs text-muted-foreground">
              Official partnerships with top institutions
            </p>
          </div>

          {/* Success Rate */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-orange-200 hover:border-orange-400 transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div className="text-3xl mb-2">{trustMetrics.placementRate}%</div>
            <div className="text-sm mb-2">Placement Success</div>
            <p className="text-xs text-muted-foreground">
              Students successfully placed through VerSona
            </p>
          </div>
        </div>

        {/* Trust Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="mb-2">Privacy First</h3>
                <p className="text-sm text-muted-foreground">
                  Your data is never sold. You control what you share and with whom.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="mb-2">Verified Profiles</h3>
                <p className="text-sm text-muted-foreground">
                  College verification ensures authentic connections with real students.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-border">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="mb-2">AI Content Safety</h3>
                <p className="text-sm text-muted-foreground">
                  8 custom ML models moderate content to keep the community safe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        {showStats && (
          <div className="mt-12 pt-12 border-t">
            <div className="text-center mb-8">
              <h3 className="text-2xl mb-2">Loved by Students</h3>
              <div className="flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-muted-foreground">4.8/5 from 2,500+ reviews</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-2">⚡</div>
                <div className="text-2xl mb-1">2 min</div>
                <div className="text-sm text-muted-foreground">
                  Average time to first connection
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl mb-2">🎯</div>
                <div className="text-2xl mb-1">85%</div>
                <div className="text-sm text-muted-foreground">
                  Students report career growth
                </div>
              </div>

              <div className="text-center">
                <div className="text-4xl mb-2">💼</div>
                <div className="text-2xl mb-1">200+</div>
                <div className="text-sm text-muted-foreground">
                  Recruiters actively hiring
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Certifications */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">Certified & Secured By</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6" />
              <span className="text-sm">ISO 27001</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-6 h-6" />
              <span className="text-sm">256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6" />
              <span className="text-sm">GDPR Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6" />
              <span className="text-sm">Made in India 🇮🇳</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// College Verification Badge Component
export function CollegeVerifiedBadge({ collegeName }: { collegeName: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs border border-blue-200">
            <CheckCircle className="w-3 h-3" />
            <span>Verified {collegeName} Student</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>This user's college affiliation has been verified</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// User Verification Badge
export function UserVerifiedBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-blue-400 to-blue-600">
            <CheckCircle className="w-3 h-3 text-white" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Verified Profile</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
