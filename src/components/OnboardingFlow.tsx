import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { updateUserProfile, getUserProfile } from "../lib/firebaseAuth";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { GraduationCap, Sparkles, Briefcase, ArrowRight, ArrowLeft, Loader2, ImagePlus, User as UserIcon, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { handleError } from "../lib/errorLogger";
import { trackEvent, AnalyticsEvents } from "../lib/analytics";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "./ui/checkbox";

const INTERESTS = [
  "AI", "Coding", "Startups", "Gaming", "Music", "Movies", 
  "Fitness", "Finance", "Memes", "Design", "Photography", 
  "Sports", "Business", "Fashion", "Content Creation"
];

const CAREER_GOALS = [
  "Software Engineer", "Data Scientist", "UI/UX Designer", 
  "Entrepreneur", "Content Creator", "Product Manager", "Freelancer"
];

const LOOKING_FOR = [
  "Jobs", "Internships", "Networking", 
  "Freelancing", "Mentorship", "Startup Team"
];

// Reusable animated wrapper for each step
const StepWrapper = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    {children}
  </motion.div>
);

export function OnboardingFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [formData, setFormData] = useState({
    college: "",
    collegeHashtag: "",
    degree: "",
    branch: "",
    graduationYear: "",
    city: "",
    interests: [] as string[],
    careerGoals: [] as string[],
    lookingFor: [] as string[],
    skills: [] as string[],
    bio: "",
    linkedin: "",
    github: "",
    portfolio: ""
  });
  
  const [skillInput, setSkillInput] = useState("");

  // Load existing data
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            if (profile.profileCompleted) {
              navigate("/feed");
              return;
            }
            setFormData(prev => ({ ...prev, ...profile }));
            if (profile.onboardingStep && profile.onboardingStep > 1 && profile.onboardingStep <= 5) {
              setStep(profile.onboardingStep);
            }
          }
        } catch (error) {
          console.error("Failed to load profile:", error);
        }
      }
      setFetching(false);
    };
    loadProfile();
  }, [user, navigate]);

  // Save partial progress
  const saveProgress = async (nextStep: number) => {
    if (!user) return;
    try {
      await updateUserProfile(user.uid, {
        ...formData,
        onboardingStep: nextStep
      });
    } catch (error) {
      console.error("Failed to save progress:", error);
    }
  };

  const handleNext = async () => {
    if (step === 1 && !formData.college.trim()) {
      toast.error("Please enter your college name");
      return;
    }
    if (step === 3 && formData.skills.length < 2) {
      toast.error("Please add at least 2 skills");
      return;
    }
    
    setLoading(true);
    await saveProgress(step + 1);
    setLoading(false);
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSkillAdd = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const handleSkillRemove = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill),
    });
  };

  const toggleArrayItem = (field: 'interests' | 'careerGoals' | 'lookingFor', item: string) => {
    setFormData(prev => {
      const array = prev[field];
      if (array.includes(item)) {
        return { ...prev, [field]: array.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...array, item] };
      }
    });
  };

  const handleComplete = async () => {
    if (!user?.uid || !user?.email) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      // Final save
      await updateUserProfile(user.uid, {
        ...formData,
        profileCompleted: true,
        onboardingStep: 5
      });

      // Join college if provided
      if (formData.college.trim()) {
        const collegeId = formData.college.trim().toLowerCase().replace(/\s+/g, "-");
        await setDoc(doc(db, "colleges", collegeId, "members", user.uid), {
          userId: user.uid,
          userEmail: user.email,
          joinedAt: serverTimestamp(),
          role: "member",
          collegeName: formData.college,
        });
        localStorage.setItem("versona-selected-college", collegeId);
      }

      trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, {
        userId: user.uid,
        college: formData.college,
        interestsCount: formData.interests.length,
        skillsCount: formData.skills.length,
      });

      localStorage.setItem("versona-just-onboarded", "true");
      
      toast.success("Welcome to MyVerSona! Your profile is all set up. 🎉");
      
      setTimeout(() => {
        navigate("/feed");
      }, 1000);
    } catch (error) {
      console.error("Onboarding completion error:", error);
      handleError(error, {
        userId: user.uid,
        context: "OnboardingFlow - Complete Setup",
        showToast: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5]">
          MyVerSona
        </h1>
      </div>

      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-10 border border-white/40">
        
        {/* Progress indicator */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Step {step} of 4</span>
              <span className="text-sm font-medium text-primary">{Math.round((step / 4) * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] transition-all duration-500 ease-out"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {/* STEP 1: EDUCATION */}
          {step === 1 && (
            <StepWrapper key="step1">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#FFB88C]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8 text-[#FFB88C]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Education Details
                </h2>
                <p className="text-gray-600">
                  Connect with your campus community and alumni
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>College Name *</Label>
                    <Input
                      placeholder="e.g. IIT Delhi"
                      value={formData.college}
                      onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>College Hashtag</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">#</span>
                      <Input
                        className="pl-7"
                        placeholder="iitdelhi"
                        value={formData.collegeHashtag}
                        onChange={(e) => setFormData({ ...formData, collegeHashtag: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Degree</Label>
                    <Input
                      placeholder="e.g. B.Tech"
                      value={formData.degree}
                      onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch / Stream</Label>
                    <Input
                      placeholder="e.g. Computer Science"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Graduation Year</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 2026"
                      value={formData.graduationYear}
                      onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      placeholder="e.g. New Delhi"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleNext}
                disabled={!formData.college.trim() || loading}
                className="w-full h-12 mt-6 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
              </Button>
            </StepWrapper>
          )}

          {/* STEP 2: INTERESTS */}
          {step === 2 && (
            <StepWrapper key="step2">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#FF6F91]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-[#FF6F91]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  What do you love?
                </h2>
                <p className="text-gray-600">
                  Select topics to personalize your entertainment feed
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-3 justify-center py-4">
                  {INTERESTS.map((interest) => {
                    const isSelected = formData.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleArrayItem('interests', interest)}
                        className={`px-5 py-2.5 rounded-full border-2 transition-all duration-300 font-medium text-sm ${
                          isSelected
                            ? "border-[#FF6F91] bg-[#FF6F91] text-white shadow-md transform scale-105"
                            : "border-gray-200 text-gray-600 hover:border-[#FF6F91]/50 hover:bg-[#FF6F91]/5"
                        }`}
                      >
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button onClick={handleBack} variant="outline" className="h-12 px-6">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 h-12 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
                  disabled={loading}
                >
                  Continue
                </Button>
              </div>
            </StepWrapper>
          )}

          {/* STEP 3: CAREER & SKILLS */}
          {step === 3 && (
            <StepWrapper key="step3">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[#6DE7C5]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="w-8 h-8 text-[#6DE7C5]" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Career Profile
                </h2>
                <p className="text-gray-600">
                  Let's set up your professional persona
                </p>
              </div>

              <div className="space-y-6 max-h-[50vh] overflow-y-auto px-2 py-2">
                
                {/* Career Goals */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Career Goals</Label>
                  <div className="flex flex-wrap gap-2">
                    {CAREER_GOALS.map((goal) => (
                      <button
                        key={goal}
                        onClick={() => toggleArrayItem('careerGoals', goal)}
                        className={`px-4 py-2 rounded-xl border transition-all text-sm ${
                          formData.careerGoals.includes(goal)
                            ? "border-[#6DE7C5] bg-[#6DE7C5]/10 text-[#2D8E74] font-medium"
                            : "border-gray-200 hover:border-[#6DE7C5]/50"
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Looking For */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">I am looking for</Label>
                  <div className="flex flex-wrap gap-2">
                    {LOOKING_FOR.map((item) => (
                      <button
                        key={item}
                        onClick={() => toggleArrayItem('lookingFor', item)}
                        className={`px-4 py-2 rounded-xl border transition-all text-sm ${
                          formData.lookingFor.includes(item)
                            ? "border-purple-400 bg-purple-50 text-purple-700 font-medium"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center justify-between">
                    <span>Your Skills <span className="text-red-500">*</span></span>
                    <span className="text-xs font-normal text-muted-foreground">(Min 2)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. React, Python, Marketing..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSkillAdd();
                        }
                      }}
                    />
                    <Button onClick={handleSkillAdd} type="button" variant="outline">Add</Button>
                  </div>
                  
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {formData.skills.map((skill) => (
                        <div key={skill} className="px-3 py-1.5 bg-gray-100 rounded-lg flex items-center gap-2 text-sm">
                          <span>{skill}</span>
                          <button onClick={() => handleSkillRemove(skill)} className="text-gray-400 hover:text-red-500 transition-colors">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={handleBack} variant="outline" className="h-12 px-6">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={formData.skills.length < 2 || loading}
                  className="flex-1 h-12 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
                >
                  Continue
                </Button>
              </div>
            </StepWrapper>
          )}

          {/* STEP 4: CUSTOMIZATION */}
          {step === 4 && (
            <StepWrapper key="step4">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FFB88C] to-[#FF6F91] rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
                  <UserIcon className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  Profile Details
                </h2>
                <p className="text-gray-600">
                  Stand out to recruiters and connections
                </p>
              </div>

              <div className="space-y-6">
                {/* Photo Placeholder */}
                <div className="flex flex-col items-center justify-center space-y-3 border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50/50">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Profile Photo</p>
                  <p className="text-xs text-gray-400">You can upload a picture later from settings.</p>
                </div>

                <div className="space-y-2">
                  <Label>Bio</Label>
                  <Textarea
                    placeholder="Tell people about yourself..."
                    className="resize-none h-24"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Social Links</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      className="pl-9"
                      placeholder="LinkedIn URL"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      className="pl-9"
                      placeholder="GitHub URL"
                      value={formData.github}
                      onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                    />
                  </div>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      className="pl-9"
                      placeholder="Portfolio / Website URL"
                      value={formData.portfolio}
                      onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button onClick={handleBack} variant="outline" className="h-12 px-6">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 h-12 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Finish Setup"}
                </Button>
              </div>
            </StepWrapper>
          )}

          {/* STEP 5: WELCOME */}
          {step === 5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center py-10 space-y-8"
            >
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] blur-xl opacity-50 rounded-full animate-pulse" />
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center relative shadow-xl mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-[#6DE7C5]" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">
                  Profile Complete!
                </h2>
                <p className="text-gray-600 max-w-sm mx-auto">
                  We're generating your personalized feed, discovering career opportunities, and finding your college peers.
                </p>
              </div>

              <Button
                onClick={handleComplete}
                disabled={loading}
                className="w-full sm:w-auto min-w-[200px] h-14 rounded-full text-lg shadow-xl shadow-[#FF6F91]/20 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? "Generating..." : "Enter MyVerSona"} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}