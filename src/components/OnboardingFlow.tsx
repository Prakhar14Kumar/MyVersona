import { useState } from "react";
import { useNavigate } from "react-router";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { updateUserProfile } from "../lib/firestoreService";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { GraduationCap, Sparkles, Briefcase, ArrowRight, Loader2 } from "lucide-react";
import { handleError } from "../lib/errorLogger";
import { trackEvent, AnalyticsEvents } from "../lib/analytics";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner@2.0.3";

const POPULAR_COLLEGES = [
  "IIT Delhi",
  "IIT Bombay",
  "IIT Madras",
  "IIT Kanpur",
  "BITS Pilani",
  "NIT Trichy",
  "IIIT Hyderabad",
  "Delhi University",
  "Mumbai University",
  "VIT Vellore",
];

const POPULAR_INTERESTS = [
  "Technology",
  "Entrepreneurship",
  "Design",
  "Marketing",
  "Finance",
  "Data Science",
  "AI/ML",
  "Web Development",
  "Sports",
  "Music",
  "Photography",
  "Writing",
];

export function OnboardingFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    college: "",
    interests: [] as string[],
    skills: [] as string[],
  });
  const [customCollege, setCustomCollege] = useState("");
  const [customInterest, setCustomInterest] = useState("");
  const [skillInput, setSkillInput] = useState("");

  const handleCollegeSelect = (college: string) => {
    setFormData({ ...formData, college });
    setCustomCollege("");
  };

  const handleCustomCollegeAdd = () => {
    if (customCollege.trim()) {
      setFormData({ ...formData, college: customCollege.trim() });
    }
  };

  const handleInterestToggle = (interest: string) => {
    if (formData.interests.includes(interest)) {
      setFormData({
        ...formData,
        interests: formData.interests.filter((i) => i !== interest),
      });
    } else {
      setFormData({
        ...formData,
        interests: [...formData.interests, interest],
      });
    }
  };

  const handleCustomInterestAdd = () => {
    if (customInterest.trim() && !formData.interests.includes(customInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, customInterest.trim()],
      });
      setCustomInterest("");
    }
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

  const handleNext = () => {
    if (step === 1 && !formData.college) {
      alert("Please select or enter your college");
      return;
    }
    if (step === 3 && formData.skills.length < 2) {
      alert("Please add at least 2 skills");
      return;
    }
    setStep(step + 1);
  };

  const handleSkip = () => {
    setStep(step + 1);
  };

  const handleComplete = async () => {
    // Validation: Ensure minimum skills requirement
    if (formData.skills.length < 2) {
      toast.error("Please add at least 2 skills to continue");
      return;
    }

    // Validation: Ensure user is authenticated
    if (!user?.uid || !user?.email) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    setLoading(true);
    try {
      // Update user profile with onboarding data
      // updateUserProfile automatically generates lowercase fields for search compatibility
      await updateUserProfile(user.uid, {
        college: formData.college,
        interests: formData.interests,
        skills: formData.skills,
        onboardingCompleted: true,
      });

      // Auto-join selected college
      // Use setDoc to colleges/{collegeId}/members/{user.uid} to satisfy Firestore rules
      const collegeId = formData.college.toLowerCase().replace(/\s+/g, "-");
      await setDoc(doc(db, "colleges", collegeId, "members", user.uid), {
        userId: user.uid,
        userEmail: user.email,
        joinedAt: serverTimestamp(),
        role: "member",
        collegeName: formData.college,
      });

      // Track onboarding completion
      trackEvent(AnalyticsEvents.ONBOARDING_COMPLETED, {
        userId: user.uid,
        college: formData.college,
        interestsCount: formData.interests.length,
        skillsCount: formData.skills.length,
      });

      // Store the college ID in localStorage for CollegePage
      localStorage.setItem("versona-selected-college", collegeId);
      
      // Mark that user just completed onboarding
      localStorage.setItem("versona-just-onboarded", "true");
      
      // Show success message
      toast.success("Welcome to VerSona! Your profile is all set up. 🎉");
      
      // Navigate to college page after a brief delay to show success message
      setTimeout(() => {
        navigate("/college");
      }, 500);
    } catch (error) {
      console.error("Onboarding completion error:", error);
      handleError(error, {
        userId: user.uid,
        context: "OnboardingFlow - Complete Setup",
        showToast: true,
        severity: "high",
        customMessage: "Failed to complete onboarding. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  s <= step
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 transition-colors ${
                    s < step ? "bg-purple-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: College Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to VerSona! 🎉
              </h2>
              <p className="text-gray-600">
                Let's get you connected with your college community
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">Select Your College</Label>
              <div className="grid grid-cols-2 gap-3">
                {POPULAR_COLLEGES.map((college) => (
                  <button
                    key={college}
                    onClick={() => handleCollegeSelect(college)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.college === college
                        ? "border-purple-600 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    <span className="font-medium">{college}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Or type your college name..."
                  value={customCollege}
                  onChange={(e) => setCustomCollege(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCustomCollegeAdd();
                    }
                  }}
                />
                <Button onClick={handleCustomCollegeAdd} variant="outline">
                  Add
                </Button>
              </div>

              {formData.college && !POPULAR_COLLEGES.includes(formData.college) && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700">
                    Selected: <strong>{formData.college}</strong>
                  </p>
                </div>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={!formData.college}
              className="w-full"
              size="lg"
            >
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 2: Interests (Optional) */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                What are you interested in?
              </h2>
              <p className="text-gray-600">
                This helps us show you relevant content (optional)
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">Select Your Interests</Label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => handleInterestToggle(interest)}
                    className={`px-4 py-2 rounded-full border-2 transition-all ${
                      formData.interests.includes(interest)
                        ? "border-purple-600 bg-purple-600 text-white"
                        : "border-gray-200 hover:border-purple-300"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom interest..."
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCustomInterestAdd();
                    }
                  }}
                />
                <Button onClick={handleCustomInterestAdd} variant="outline">
                  Add
                </Button>
              </div>

              {formData.interests.length > 0 && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700 mb-2">
                    <strong>Selected:</strong> {formData.interests.length} interests
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSkip}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Skip
              </Button>
              <Button onClick={handleNext} className="flex-1" size="lg">
                Continue <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Skills (Required) */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-purple-600" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Add your skills
              </h2>
              <p className="text-gray-600">
                Share 2-3 skills to help others discover your talents
              </p>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold">
                Your Skills (at least 2 required)
              </Label>
              
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., React, UI/UX Design, Python..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSkillAdd();
                    }
                  }}
                />
                <Button onClick={handleSkillAdd} variant="outline">
                  Add
                </Button>
              </div>

              {formData.skills.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Added skills ({formData.skills.length}):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill) => (
                      <div
                        key={skill}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full flex items-center gap-2"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => handleSkillRemove(skill)}
                          className="text-purple-500 hover:text-purple-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.skills.length < 2 && (
                <p className="text-sm text-amber-600">
                  Please add at least {2 - formData.skills.length} more skill(s)
                </p>
              )}
            </div>

            <Button
              onClick={handleComplete}
              disabled={loading || formData.skills.length < 2}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Setting up your profile...
                </>
              ) : (
                <>
                  Complete Setup <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}