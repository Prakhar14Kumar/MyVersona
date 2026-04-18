import { useState, useRef, useEffect } from "react";
import { Home, Compass, School, Bookmark, MessageCircle, Settings, Bell, User, Lock, Palette, Database, HelpCircle, Shield, Mail, Smartphone, Globe, Eye, EyeOff, ChevronRight, Camera, LogOut, Loader2, Share2, Copy, Check } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { useAuth } from "../hooks/useAuth";
import { signOut as firebaseSignOut, updateUserProfile, uploadProfilePicture } from "../lib/firebaseAuth";
import { ensureReferralCode, getReferralStats, shareReferralCode, generateShareText } from "../lib/referralService";
import { toast } from "sonner@2.0.3";

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const { user, userProfile } = useAuth();
  const [activePage, setActivePage] = useState("settings");
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoadingReferral, setIsLoadingReferral] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [displayName, setDisplayName] = useState(userProfile?.displayName || user?.displayName || "");
  const [bio, setBio] = useState(userProfile?.bio || "");
  const [college, setCollege] = useState(userProfile?.college || "");
  const [major, setMajor] = useState(userProfile?.major || "");
  const [year, setYear] = useState(userProfile?.year || "2026");
  const [role, setRole] = useState(userProfile?.role || "student");

  // Sync form state when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || user?.displayName || "");
      setBio(userProfile.bio || "");
      setCollege(userProfile.college || "");
      setMajor(userProfile.major || "");
      setYear(userProfile.year || "2026");
      setRole(userProfile.role || "student");
    }
  }, [userProfile, user]);

  useEffect(() => {
    const loadReferralData = async () => {
      setIsLoadingReferral(true);
      try {
        const code = await ensureReferralCode(user?.uid);
        setReferralCode(code);
        const stats = await getReferralStats(user?.uid);
        setReferralCount(stats.referralCount);
      } catch (error) {
        console.error("Referral data load error:", error);
      } finally {
        setIsLoadingReferral(false);
      }
    };

    if (user?.uid) {
      loadReferralData();
    }
  }, [user?.uid]);

  const sidebarItems = [
    { icon: Home, label: "Home", id: "home" },
    { icon: Compass, label: "Explore", id: "explore" },
    { icon: School, label: "College", id: "college" },
    { icon: Bookmark, label: "Saved", id: "saved" },
    { icon: MessageCircle, label: "Messages", id: "messages" },
    { icon: Settings, label: "Settings", id: "settings" },
  ];

  const settingsTabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "account", label: "Account", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "data", label: "Data & Storage", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-border fixed left-0 top-0 h-full flex flex-col">
        <div className="p-6 border-b">
          <div className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
            VERSONA
          </div>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
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
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 text-[#FF6F91]"
                    : "hover:bg-accent"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground gap-2"
            onClick={async () => {
              try {
                await firebaseSignOut();
                onNavigate("landing");
              } catch (error) {
                console.error("Logout error:", error);
              }
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 mr-80">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-border">
          <div className="p-4">
            <h2>Settings</h2>
            <p className="text-xs text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        <div className="flex">
          {/* Settings Navigation */}
          <div className="w-64 border-r border-border p-4 space-y-1">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                    isActive
                      ? "bg-gradient-to-r from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 text-[#FF6F91]"
                      : "hover:bg-accent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6 space-y-6">
            {/* Profile Settings */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Update your profile details and public information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={userProfile?.photoURL || user?.photoURL} />
                        <AvatarFallback>{user?.displayName?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file && user) {
                              if (file.size > 5 * 1024 * 1024) {
                                toast.error("Image size should be less than 5MB");
                                return;
                              }
                              setIsUploadingPhoto(true);
                              try {
                                await uploadProfilePicture(user.uid, file);
                                toast.success("Profile picture updated!");
                              } catch (error: any) {
                                toast.error(error.message || "Failed to upload photo");
                              } finally {
                                setIsUploadingPhoto(false);
                              }
                            }
                          }}
                          className="hidden"
                        />
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90 gap-2"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                        >
                          {isUploadingPhoto ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4" />
                              Change Photo
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF, max 5MB</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="displayName">Full Name</Label>
                      <Input 
                        id="displayName" 
                        placeholder="Enter your full name" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        placeholder="your.email@example.com" 
                        value={user?.email || ''} 
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="college">College</Label>
                      <Input 
                        id="college"
                        placeholder="Your college name" 
                        value={college}
                        onChange={(e) => setCollege(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Primary Role</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                          <SelectItem value="alumni">Alumni</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="year">Graduation Year</Label>
                        <Select value={year} onValueChange={setYear}>
                          <SelectTrigger id="year">
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2025">2025</SelectItem>
                            <SelectItem value="2026">2026</SelectItem>
                            <SelectItem value="2027">2027</SelectItem>
                            <SelectItem value="2028">2028</SelectItem>
                            <SelectItem value="2029">2029</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="major">Major</Label>
                        <Input 
                          id="major" 
                          placeholder="Computer Science" 
                          value={major}
                          onChange={(e) => setMajor(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button 
                      className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
                      onClick={async () => {
                        if (!user) return;
                        setIsSaving(true);
                        try {
                          await updateUserProfile(user.uid, {
                            displayName,
                            bio,
                            college,
                            major,
                            year,
                            role: role as 'student' | 'recruiter' | 'alumni',
                          });
                          toast.success("Profile updated successfully!");
                        } catch (error: any) {
                          toast.error(error.message || "Failed to update profile");
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Social Links</CardTitle>
                    <CardDescription>Connect your social media accounts</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <Input id="linkedin" placeholder="linkedin.com/in/username" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      <Input id="github" placeholder="github.com/username" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portfolio">Portfolio</Label>
                      <Input id="portfolio" placeholder="yourwebsite.com" />
                    </div>
                    <Button variant="outline">Update Links</Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 border-[#FF6F91]/20">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-[#FF6F91]" />
                      <CardTitle>Invite Friends</CardTitle>
                    </div>
                    <CardDescription>Share VerSona with your college friends and earn rewards!</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {isLoadingReferral ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#FF6F91]" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="referralCode" className="text-sm">Your Referral Code</Label>
                          <div className="flex gap-2">
                            <Input 
                              id="referralCode"
                              value={referralCode}
                              readOnly
                              className="bg-white border-[#FF6F91]/20 h-12 tracking-wider"
                            />
                            <Button
                              variant="outline"
                              className="h-12 px-4"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(referralCode);
                                  setIsCopied(true);
                                  toast.success("Referral code copied!");
                                  setTimeout(() => setIsCopied(false), 2000);
                                } catch (error) {
                                  toast.error("Failed to copy code");
                                }
                              }}
                            >
                              {isCopied ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-lg bg-white border border-[#FF6F91]/10">
                          <div>
                            <p className="text-sm">Friends Invited</p>
                            <p className="text-muted-foreground text-xs">Spread the word to your network</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#FF6F91]">{referralCount}</p>
                            <p className="text-xs text-muted-foreground">referrals</p>
                          </div>
                        </div>

                        <Button
                          className="w-full h-12 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90 gap-2"
                          onClick={async () => {
                            try {
                              const shared = await shareReferralCode(referralCode);
                              if (shared) {
                                toast.success("Referral link shared!");
                              } else {
                                toast.success("Referral code copied to clipboard!");
                              }
                            } catch (error) {
                              toast.error("Failed to share referral code");
                            }
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                          Share Referral Code
                        </Button>

                        <p className="text-xs text-center text-muted-foreground">
                          Help your friends discover VerSona and grow your college network together! 🚀
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Account Settings */}
            {activeTab === "account" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>Manage your email, password, and account security</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input id="email" type="email" defaultValue="john.doe@example.com" />
                      <p className="text-xs text-muted-foreground">Your email is verified</p>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="mb-4">Change Password</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input id="currentPassword" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input id="newPassword" type="password" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input id="confirmPassword" type="password" />
                        </div>
                        <Button variant="outline">Update Password</Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p>Two-Factor Authentication</p>
                        <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Feed Preferences</CardTitle>
                    <CardDescription>Customize your feed experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Show Entertainment Feed by Default</p>
                        <p className="text-xs text-muted-foreground">Open entertainment feed when you log in</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Show Career Feed by Default</p>
                        <p className="text-xs text-muted-foreground">Open career feed when you log in</p>
                      </div>
                      <Switch />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Auto-play Videos</p>
                        <p className="text-xs text-muted-foreground">Videos will play automatically in feed</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible account actions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                      Deactivate Account
                    </Button>
                    <Button variant="destructive" className="w-full justify-start">
                      Delete Account Permanently
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Push Notifications</CardTitle>
                    <CardDescription>Manage your push notification preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p>All Notifications</p>
                        <p className="text-xs text-muted-foreground">Enable all push notifications</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Post Interactions</p>
                        <p className="text-xs text-muted-foreground">Likes, comments, and shares</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>New Messages</p>
                        <p className="text-xs text-muted-foreground">Direct messages and group chats</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Connection Requests</p>
                        <p className="text-xs text-muted-foreground">New follower requests</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>College Updates</p>
                        <p className="text-xs text-muted-foreground">News and announcements from your college</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Email Notifications</CardTitle>
                    <CardDescription>Choose what emails you receive</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Weekly Digest</p>
                        <p className="text-xs text-muted-foreground">Summary of your weekly activity</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Career Opportunities</p>
                        <p className="text-xs text-muted-foreground">Job postings and internship alerts</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Event Reminders</p>
                        <p className="text-xs text-muted-foreground">Upcoming events you're interested in</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Product Updates</p>
                        <p className="text-xs text-muted-foreground">New features and announcements</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Privacy Settings */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Privacy Controls</CardTitle>
                    <CardDescription>Control who can see your content and profile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="profileVisibility">Profile Visibility</Label>
                      <Select defaultValue="public">
                        <SelectTrigger id="profileVisibility">
                          <SelectValue placeholder="Choose visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public - Anyone can see</SelectItem>
                          <SelectItem value="college">College Only - Only your college</SelectItem>
                          <SelectItem value="connections">Connections Only</SelectItem>
                          <SelectItem value="private">Private - Only you</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p>Show Your College</p>
                        <p className="text-xs text-muted-foreground">Display your college on your profile</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Show Graduation Year</p>
                        <p className="text-xs text-muted-foreground">Display your graduation year</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Show Activity Status</p>
                        <p className="text-xs text-muted-foreground">Let others see when you're online</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Content Preferences</CardTitle>
                    <CardDescription>Control what content you see</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Hide Sensitive Content</p>
                        <p className="text-xs text-muted-foreground">Filter potentially sensitive posts</p>
                      </div>
                      <Switch />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Show Recruiter Posts in Feed</p>
                        <p className="text-xs text-muted-foreground">Display job postings in your feed</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Blocked Accounts</CardTitle>
                    <CardDescription>Manage blocked users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">You haven't blocked anyone yet</p>
                    <Button variant="outline" className="mt-4">Manage Blocked Users</Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Appearance Settings */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Theme</CardTitle>
                    <CardDescription>Choose your interface theme</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Color Theme</Label>
                      <Select defaultValue="light">
                        <SelectTrigger id="theme">
                          <SelectValue placeholder="Choose theme" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light Mode</SelectItem>
                          <SelectItem value="dark">Dark Mode</SelectItem>
                          <SelectItem value="auto">Auto (System Default)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div>
                      <Label className="mb-3 block">Gradient Accent</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <button className="h-16 rounded-lg bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] border-2 border-[#FF6F91]" />
                        <button className="h-16 rounded-lg bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 border-2 border-transparent hover:border-[#FF6F91]" />
                        <button className="h-16 rounded-lg bg-gradient-to-r from-blue-400 via-cyan-500 to-teal-500 border-2 border-transparent hover:border-[#FF6F91]" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Display</CardTitle>
                    <CardDescription>Customize how content appears</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fontSize">Font Size</Label>
                      <Select defaultValue="medium">
                        <SelectTrigger id="fontSize">
                          <SelectValue placeholder="Choose size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <p>Reduce Motion</p>
                        <p className="text-xs text-muted-foreground">Minimize animations</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Data & Storage Settings */}
            {activeTab === "data" && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>Download or delete your data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p>Download Your Data</p>
                        <p className="text-xs text-muted-foreground">Get a copy of your VerSona data</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Request Download
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p>Storage Used</p>
                        <p className="text-xs text-muted-foreground">125 MB of 5 GB</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage Storage
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Cache & Offline</CardTitle>
                    <CardDescription>Manage cached data and offline settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Save Media</p>
                        <p className="text-xs text-muted-foreground">Automatically save media to device</p>
                      </div>
                      <Switch />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <p>Cache Size</p>
                        <p className="text-xs text-muted-foreground">42 MB cached</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Clear Cache
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Help & Support</CardTitle>
                    <CardDescription>Get help and view documentation</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Help Center
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Globe className="h-4 w-4" />
                      Terms of Service
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <Shield className="h-4 w-4" />
                      Privacy Policy
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">VerSona Version</p>
                      <p>v1.0.0 (Beta)</p>
                    </div>
                    <Badge variant="secondary">Up to date</Badge>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-80 bg-white border-l border-border fixed right-0 top-0 h-full overflow-y-auto">
        <div className="p-6 space-y-6">
          <Card className="bg-gradient-to-r from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 border-[#FF6F91]/20">
            <CardContent className="p-4">
              <h4 className="mb-2">Quick Tip</h4>
              <p className="text-xs text-muted-foreground">
                Keep your profile updated to get better recommendations and connect with the right people!
              </p>
            </CardContent>
          </Card>

          <div>
            <h4 className="mb-4">Recent Activity</h4>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF6F91] mt-1.5" />
                <p>Profile updated 2 days ago</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#6DE7C5] mt-1.5" />
                <p>Password changed 1 week ago</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FFB88C] mt-1.5" />
                <p>Email verified 2 weeks ago</p>
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="p-4">
              <h4 className="mb-3">Need Help?</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Contact our support team for assistance with your account
              </p>
              <Button variant="outline" size="sm" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  );
}