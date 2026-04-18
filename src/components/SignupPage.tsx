import { useState } from "react";
import { signUpWithEmail, signInWithGoogle, updateUserProfile } from "../lib/firebaseAuth";
import { validatePassword, validateEmail, validateName, validateCollege, validateHashtag, globalRateLimiter } from "../utils/validation";
import { useOnlineStatus } from "../utils/offline";
import { trackEvent, AnalyticsEvents, setAnalyticsUserId } from "../lib/analytics";
import { ensureReferralCode, getUserByReferralCode, trackReferral } from "../lib/referralService";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Sparkles, Zap, GraduationCap, Users, Loader2, Hexagon } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

// Provide a reliable fallback logo icon component inline
const VersonaLogo = () => (
  <div className="flex items-center justify-center w-full h-full text-white">
    <Hexagon size={48} className="fill-white/20 stroke-white" strokeWidth={1.5} />
  </div>
);
// Toast helper
const showToast = {
  success: (msg: string) => {
    console.log('✅', msg);
    alert(msg);
  },
  error: (msg: string) => {
    console.error('❌', msg);
    alert(msg);
  },
};

export function SignupPage() {
  const navigate = useNavigate();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    college: "",
    hashtag: "",
    preferences: [] as string[],
    referralCode: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    name: "",
    email: "",
    password: [] as string[],
    college: "",
    hashtag: "",
  });
  const isOnline = useOnlineStatus();

  // Validate name in real-time
  const handleNameChange = (value: string) => {
    setFormData({ ...formData, name: value });
    if (value.length > 0) {
      const validation = validateName(value);
      setValidationErrors({ ...validationErrors, name: validation.error || "" });
    } else {
      setValidationErrors({ ...validationErrors, name: "" });
    }
  };

  // Validate email in real-time
  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value });
    if (value.length > 0) {
      const validation = validateEmail(value);
      setValidationErrors({ ...validationErrors, email: validation.error || "" });
    } else {
      setValidationErrors({ ...validationErrors, email: "" });
    }
  };

  // Validate password in real-time
  const handlePasswordChange = (value: string) => {
    setFormData({ ...formData, password: value });
    if (value.length > 0) {
      const validation = validatePassword(value);
      setValidationErrors({ ...validationErrors, password: validation.errors });
    } else {
      setValidationErrors({ ...validationErrors, password: [] });
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check offline status
    if (!isOnline) {
      showToast.error("You're offline. Please check your connection and try again.");
      return;
    }

    // Rate limiting check
    if (!globalRateLimiter.isAllowed(`signup:${formData.email}`, 3, 300000)) {
      const remaining = globalRateLimiter.getRemainingTime(`signup:${formData.email}`, 300000);
      showToast.error(`Too many attempts. Please try again in ${remaining} seconds.`);
      return;
    }

    // Final validation before submission
    const nameValidation = validateName(formData.name);
    const emailValidation = validateEmail(formData.email);
    const passwordValidation = validatePassword(formData.password);

    if (!nameValidation.isValid) {
      showToast.error(nameValidation.error || "Invalid name");
      return;
    }

    if (!emailValidation.isValid) {
      showToast.error(emailValidation.error || "Invalid email");
      return;
    }

    if (!passwordValidation.isValid) {
      showToast.error(passwordValidation.errors[0] || "Invalid password");
      return;
    }

    setLoading(true);
    
    try {
      const user = await signUpWithEmail(
        formData.email.trim(),
        formData.password,
        formData.name.trim()
      );
      
      setUserId(user.uid);
      showToast.success("Account created successfully! 🎉");
      
      // Track signup event
      await trackEvent(AnalyticsEvents.SIGNUP, {
        method: 'email',
        user_id: user.uid,
      });
      await setAnalyticsUserId(user.uid);
      
      // Reset rate limiter on success
      globalRateLimiter.reset(`signup:${formData.email}`);
      
      // Redirect to onboarding
      navigate("/onboarding");
    } catch (error: any) {
      console.error("Signup error:", error);
      
      // User-friendly error messages
      let errorMessage = "Failed to create account. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered. Please sign in instead.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Please choose a stronger password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      }
      
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    // Check offline status
    if (!isOnline) {
      showToast.error("You're offline. Please check your connection and try again.");
      return;
    }

    // Rate limiting
    if (!globalRateLimiter.isAllowed('google-signup', 5, 60000)) {
      showToast.error("Too many attempts. Please try again in a moment.");
      return;
    }

    setLoading(true);
    
    try {
      const user = await signInWithGoogle();
      setUserId(user.uid);
      showToast.success("Signed in with Google! 🎉");
      
      globalRateLimiter.reset('google-signup');
      
      // Redirect to onboarding
      navigate("/onboarding");
    } catch (error: any) {
      console.error("Google signup error:", error);
      
      let errorMessage = "Failed to sign in with Google.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up blocked. Please allow pop-ups for this site.";
      }
      
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSetup = async () => {
    if (formData.preferences.length < 3) {
      showToast.error("Please select at least 3 interests");
      return;
    }

    // Validate college and hashtag if provided
    if (formData.college.trim()) {
      const collegeValidation = validateCollege(formData.college);
      if (!collegeValidation.isValid) {
        showToast.error(collegeValidation.error || "Invalid college name");
        return;
      }
    }

    if (formData.hashtag.trim()) {
      const hashtagValidation = validateHashtag(formData.hashtag);
      if (!hashtagValidation.isValid) {
        showToast.error(hashtagValidation.error || "Invalid hashtag");
        return;
      }
    }

    setLoading(true);
    
    try {
      // SAFE: Only include fields that have values
      const updates: any = {
        interests: formData.preferences,
        role: 'student',
      };
      
      if (formData.college.trim()) {
        updates.college = formData.college.trim();
      }
      
      await updateUserProfile(userId, updates);
      
      // Generate referral code for new user
      try {
        await ensureReferralCode(userId);
      } catch (error) {
        console.error('Failed to generate referral code:', error);
        // Don't block signup if referral code generation fails
      }
      
      // Track referral if code was provided
      if (formData.referralCode.trim()) {
        try {
          const inviterId = await getUserByReferralCode(formData.referralCode.trim());
          if (inviterId) {
            await trackReferral(inviterId, userId, formData.referralCode.trim().toUpperCase());
            showToast.success("Profile completed! Welcome to VerSona 🇮🇳 (Referral applied!)");
          } else {
            showToast.success("Profile completed! Welcome to VerSona 🇮🇳 (Invalid referral code)");
          }
        } catch (error) {
          console.error('Failed to track referral:', error);
          showToast.success("Profile completed! Welcome to VerSona 🇮🇳");
        }
      } else {
        showToast.success("Profile completed! Welcome to VerSona 🇮🇳");
      }
      
      setShowProfileSetup(false);
      navigate("/feed");
    } catch (error: any) {
      console.error("Profile update error:", error);
      showToast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const preferences = [
    "Technology", "Entertainment", "Sports", "Music", "Art & Design",
    "Business", "Science", "Fashion", "Gaming", "Photography"
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Indian-themed 3D Gradient Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] p-12 flex-col justify-center items-center text-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {/* Indian Pattern Overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        {/* Content */}
        <div className="relative z-10 max-w-md space-y-8 text-center">
          {/* Logo with 3D effect */}
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl mb-4" 
                 style={{ transform: 'perspective(1000px) rotateY(-10deg)' }}>
              <VersonaLogo />
            </div>
            <h1 className="text-5xl lg:text-6xl tracking-tight leading-tight" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              VERSONA
            </h1>
            <p className="text-xl lg:text-2xl opacity-90 leading-relaxed">
              Where Entertainment Meets Opportunity
            </p>
          </div>

          {/* Indian College Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20" 
               style={{ transform: 'perspective(1000px) rotateY(-5deg)' }}>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1591062182630-2cae7655ed1b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBjb2xsZWdlJTIwY2FtcHVzJTIwc3R1ZGVudHN8ZW58MXx8fHwxNzYxMDM3NTQ4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Indian College Students"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>

          {/* Feature Cards with 3D Effect */}
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-4 bg-white/15 backdrop-blur-md rounded-xl p-4 shadow-xl hover:bg-white/20 transition-all duration-300"
                 style={{ transform: 'perspective(1000px) translateZ(0)' }}>
              <div className="w-12 h-12 bg-white/25 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="leading-tight">Dual Feed System</div>
                <div className="text-sm opacity-80 leading-relaxed">Switch between fun & career instantly</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/15 backdrop-blur-md rounded-xl p-4 shadow-xl hover:bg-white/20 transition-all duration-300"
                 style={{ transform: 'perspective(1000px) translateZ(0)' }}>
              <div className="w-12 h-12 bg-white/25 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="leading-tight">Your College Community</div>
                <div className="text-sm opacity-80 leading-relaxed">Connect with students from your campus</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/15 backdrop-blur-md rounded-xl p-4 shadow-xl hover:bg-white/20 transition-all duration-300"
                 style={{ transform: 'perspective(1000px) translateZ(0)' }}>
              <div className="w-12 h-12 bg-white/25 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="leading-tight">AI Career Growth</div>
                <div className="text-sm opacity-80 leading-relaxed">Personalized opportunities for Indian students</div>
              </div>
            </div>
          </div>

          {/* Made in India Badge */}
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full shadow-lg">
            <span className="text-2xl">🇮🇳</span>
            <span className="leading-tight">Proudly Made in India</span>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl lg:text-4xl tracking-tight leading-tight">Create Your Account</h2>
            <p className="text-muted-foreground leading-relaxed">Join thousands of Indian students on VerSona</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="h-12"
                />
                {validationErrors.name && <p className="text-xs text-red-500 leading-relaxed">{validationErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  required
                  className="h-12"
                />
                {validationErrors.email && <p className="text-xs text-red-500 leading-relaxed">{validationErrors.email}</p>}
                <p className="text-xs text-muted-foreground leading-relaxed">Any valid email address works</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  className="h-12"
                />
                
                {validationErrors.password.length > 0 && (
                   <ul className="text-xs text-red-500 leading-relaxed list-disc pl-4">
                      {validationErrors.password.map((err, i) => (
                         <li key={`pwd-error-${i}`}>{err}</li>
                      ))}
                   </ul>
                )}
                
                {validationErrors.password.length === 0 && (
                   <p className="text-xs text-muted-foreground leading-relaxed">Minimum 8 characters, 1 uppercase, 1 number recommended</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90 transition-all shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Continue to Profile Setup
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground leading-tight">Or continue with</span>
            </div>
          </div>

          {/* Google Button */}
          <Button
            variant="outline"
            className="w-full h-12 hover:bg-muted/50 transition-all"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground leading-relaxed">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-[#FF6F91] hover:underline transition-all"
            >
              Log In
            </button>
          </p>
        </div>
      </div>

      {/* Profile Setup Modal */}
      <Dialog open={showProfileSetup} onOpenChange={setShowProfileSetup}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl tracking-tight">Complete Your Profile</DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed pt-1">
              Help us personalize your VerSona experience
            </p>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* College Selection */}
            <div className="space-y-2">
              <Label htmlFor="college" className="text-sm">College Name</Label>
              <Input
                id="college"
                placeholder="Search for your college (e.g., IIT Delhi, VIT Vellore...)"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                className="h-12"
              />
              {validateCollege(formData.college) && <p className="text-xs text-red-500 leading-relaxed">{validateCollege(formData.college)}</p>}
              <p className="text-xs text-muted-foreground leading-relaxed">
                Start typing to search from our list of 500+ Indian colleges
              </p>
            </div>

            {/* College Hashtag */}
            <div className="space-y-2">
              <Label htmlFor="hashtag" className="text-sm">College Hashtag</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-lg">#</span>
                <Input
                  id="hashtag"
                  placeholder="e.g., iitdelhi, vitvellore, delhiuniversity"
                  value={formData.hashtag}
                  onChange={(e) => setFormData({ ...formData, hashtag: e.target.value })}
                  className="h-12"
                />
              </div>
              {validateHashtag(formData.hashtag) && <p className="text-xs text-red-500 leading-relaxed">{validateHashtag(formData.hashtag)}</p>}
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will help you connect with your college community
              </p>
            </div>

            {/* Interests */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm">Your Interests (Select at least 3)</Label>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We'll customize your feed based on your interests
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {preferences.map((pref) => (
                  <div key={pref} className="flex items-center space-x-2 p-3 rounded-lg border hover:border-[#FF6F91]/50 transition-colors">
                    <Checkbox
                      id={pref}
                      checked={formData.preferences.includes(pref)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            preferences: [...formData.preferences, pref],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            preferences: formData.preferences.filter((p) => p !== pref),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={pref} className="cursor-pointer text-sm leading-tight">
                      {pref}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Code (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="referralCode" className="text-sm">Referral Code (Optional)</Label>
              <Input
                id="referralCode"
                placeholder="Enter referral code (e.g., ABC123)"
                value={formData.referralCode}
                onChange={(e) => setFormData({ ...formData, referralCode: e.target.value.toUpperCase() })}
                className="h-12"
                maxLength={6}
              />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Have a friend on VerSona? Enter their referral code!
              </p>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleProfileSetup}
              className="w-full h-12 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90 transition-all shadow-lg"
              disabled={formData.preferences.length < 3 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Save & Continue to VerSona
                </>
              )}
            </Button>
            {formData.preferences.length < 3 && (
              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                Please select at least 3 interests to continue
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}