import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Sparkles, TrendingUp, MessageSquare, Briefcase, Loader2 } from "lucide-react";
import { signInWithEmail, signInWithGoogle, sendPasswordReset, getUserProfile } from "../lib/firebaseAuth";
import { auth } from "../lib/firebase";
import { validateEmail, globalRateLimiter } from "../utils/validation";
import { useOnlineStatus } from "../utils/offline";
import { useNavigate } from "react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";

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

export function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    resetEmail: "",
  });
  const isOnline = useOnlineStatus();

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

  // Validate reset email in real-time
  const handleResetEmailChange = (value: string) => {
    setResetEmail(value);
    if (value.length > 0) {
      const validation = validateEmail(value);
      setValidationErrors({ ...validationErrors, resetEmail: validation.error || "" });
    } else {
      setValidationErrors({ ...validationErrors, resetEmail: "" });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check offline status
    if (!isOnline) {
      showToast.error("You're offline. Please check your connection and try again.");
      return;
    }

    // Rate limiting check
    if (!globalRateLimiter.isAllowed(`login:${formData.email}`, 5, 300000)) {
      const remaining = globalRateLimiter.getRemainingTime(`login:${formData.email}`, 300000);
      showToast.error(`Too many login attempts. Please try again in ${remaining} seconds.`);
      return;
    }

    // Validate email before submission
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.isValid) {
      showToast.error(emailValidation.error || "Invalid email");
      return;
    }

    // Validate password is not empty
    if (!formData.password || formData.password.trim().length === 0) {
      showToast.error("Please enter your password");
      return;
    }

    setLoading(true);
    
    try {
      const user = await signInWithEmail(formData.email.trim(), formData.password);
      
      showToast.success("Welcome back to MyVerSona! 🎉");
      globalRateLimiter.reset(`login:${formData.email}`);
      
      // Check if profile is completed
      const profile = await getUserProfile(user.uid);
      if (profile && profile.profileCompleted === false) {
        navigate("/onboarding");
      } else {
        navigate("/feed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // User-friendly error messages
      let errorMessage = error.message || "Failed to sign in. Please check your credentials.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email. Please sign up first.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again or reset your password.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later or reset your password.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support.";
      }
      
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Check offline status
    if (!isOnline) {
      showToast.error("You're offline. Please check your connection and try again.");
      return;
    }

    // Rate limiting
    if (!globalRateLimiter.isAllowed('google-login', 5, 60000)) {
      showToast.error("Too many attempts. Please try again in a moment.");
      return;
    }

    setLoading(true);
    
    try {
      const user = await signInWithGoogle();
      
      showToast.success("Signed in with Google! 🎉");
      globalRateLimiter.reset('google-login');
      
      // Check if profile is completed
      const profile = await getUserProfile(user.uid);
      if (profile && profile.profileCompleted === false) {
        navigate("/onboarding");
      } else {
        navigate("/feed");
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      
      let errorMessage = error.message || "Failed to sign in with Google.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up blocked. Please allow pop-ups for this site.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email using a different sign-in method.";
      }
      
      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check offline status
    if (!isOnline) {
      showToast.error("You're offline. Please check your connection and try again.");
      return;
    }

    // Validate email
    const emailValidation = validateEmail(resetEmail);
    if (!emailValidation.isValid) {
      showToast.error(emailValidation.error || "Please enter a valid email address");
      return;
    }

    // Rate limiting
    if (!globalRateLimiter.isAllowed(`reset:${resetEmail}`, 3, 300000)) {
      const remaining = globalRateLimiter.getRemainingTime(`reset:${resetEmail}`, 300000);
      showToast.error(`Too many reset attempts. Please try again in ${remaining} seconds.`);
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordReset(resetEmail.trim());
      showToast.success("Password reset email sent! Check your inbox.");
      setShowForgotPassword(false);
      setResetEmail("");
      
      globalRateLimiter.reset(`reset:${resetEmail}`);
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      let errorMessage = "Failed to send reset email";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many requests. Please try again later.";
      }
      
      showToast.error(errorMessage);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Indian-themed 3D Gradient Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] p-12 flex-col justify-center items-center text-white relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Indian Pattern Overlay */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>

        {/* Content */}
        <div className="relative z-10 max-w-md space-y-8 text-center">
          {/* Logo with 3D effect */}
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl shadow-2xl mb-4" 
                 style={{ transform: 'perspective(1000px) rotateY(-10deg)' }}>
              <img src="/logo.jpg" alt="MyVerSona Logo" className="w-full h-full object-cover rounded-3xl" />
            </div>
            <p className="text-xl lg:text-2xl opacity-90 leading-relaxed">
              Welcome Back to Your Community!
            </p>
          </div>

          {/* Indian Students Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20" 
               style={{ transform: 'perspective(1000px) rotateY(-5deg)' }}>
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1664388287491-9291c2e294bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBzdHVkZW50cyUyMHN0dWR5aW5nJTIwdG9nZXRoZXJ8ZW58MXx8fHwxNzYxMDM3NTQ5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Indian Students"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>

          {/* Activity Cards with 3D Effect */}
          <div className="space-y-3 text-left">
            <div className="flex items-center gap-4 bg-white/15 backdrop-blur-md rounded-xl p-4 shadow-xl hover:bg-white/20 transition-all duration-300"
                 style={{ transform: 'perspective(1000px) translateZ(0)' }}>
              <div className="w-12 h-12 bg-white/25 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="leading-tight">Your Dual Feed Awaits</div>
                <div className="text-sm opacity-80 leading-relaxed">See what's trending in your college</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/15 backdrop-blur-md rounded-xl p-4 shadow-xl hover:bg-white/20 transition-all duration-300"
                 style={{ transform: 'perspective(1000px) translateZ(0)' }}>
              <div className="w-12 h-12 bg-white/25 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="leading-tight">New Messages</div>
                <div className="text-sm opacity-80 leading-relaxed">Connect with friends and recruiters</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-white/15 backdrop-blur-md rounded-xl p-4 shadow-xl hover:bg-white/20 transition-all duration-300"
                 style={{ transform: 'perspective(1000px) translateZ(0)' }}>
              <div className="w-12 h-12 bg-white/25 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <div className="leading-tight">New Opportunities</div>
                <div className="text-sm opacity-80 leading-relaxed">Jobs & internships waiting for you</div>
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

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl lg:text-4xl tracking-tight leading-tight">Welcome Back</h2>
            <p className="text-muted-foreground leading-relaxed">Sign in to continue your journey on MyVerSona</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@college.edu"
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  required
                  className="h-12"
                />
                {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm">Password</Label>
                  <button 
                    type="button" 
                    className="text-xs text-[#FF6F91] hover:underline transition-all"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="h-12"
                />
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
                  Signing In...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Sign In to MyVerSona
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
            onClick={handleGoogleLogin}
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
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-[#FF6F91] hover:underline transition-all"
            >
              Sign Up
            </button>
          </p>

          {/* Trust Badge */}
          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span>🔒</span>
              <span className="leading-tight">Secure Login</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span>🇮🇳</span>
              <span className="leading-tight">Made in India</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we'll send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your.email@college.edu"
                value={resetEmail}
                onChange={(e) => handleResetEmailChange(e.target.value)}
                required
              />
              {validationErrors.resetEmail && <p className="text-red-500 text-xs mt-1">{validationErrors.resetEmail}</p>}
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
              disabled={resetLoading}
            >
              {resetLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}