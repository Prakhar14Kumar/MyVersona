import { useState, useRef } from "react";
import { X, Image as ImageIcon, Loader2, Video, Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { createPost as createFirestorePost } from "../lib/firestoreService";
import { uploadImage } from "../lib/cloudinary";
import { backendService } from "../lib/backendService";
import { toast } from "sonner";
import { VideoUpload } from "./VideoUpload";
import { AIContentTools } from "./AIContentTools";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { validatePostContent, validateImageFile, validateVideoFile } from "../utils/validation";
import { useOnlineStatus } from "../utils/offline";
import { useAuth } from "../hooks/useAuth";
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { trackPostCreated } from "../lib/userBehaviorTracker";
import { handleError } from "../lib/errorLogger";

interface CreatePostProps {
  user: {
    uid: string;
    displayName: string;
    photoURL?: string;
  };
  userCollege?: string;
  onPostCreated?: () => void;
}

export function CreatePost({ user, userCollege, onPostCreated }: CreatePostProps) {
  const { userProfile } = useAuth();
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<"entertainment" | "career">("entertainment");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVideoUpload, setShowVideoUpload] = useState(false);
  const [showAITools, setShowAITools] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isOnline = useOnlineStatus();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        toast.error(validation.error || "Invalid image file");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile && !videoUrl) {
      toast.error("Please add some content, an image, or a video");
      return;
    }

    // Validate content if provided
    if (content.trim()) {
      const contentValidation = validatePostContent(content);
      if (!contentValidation.isValid) {
        toast.error(contentValidation.error || "Invalid post content");
        return;
      }
    }

    if (!isOnline) {
      toast.error("You are offline. Please connect to the internet to create a post.");
      return;
    }

    setIsSubmitting(true);

    try {
      // AI Content Moderation
      if (content.trim()) {
        try {
          const moderation = await backendService.checkContent(content.trim());
          if (!moderation.is_safe) {
            toast.error(`Content blocked: ${moderation.reason || "Violates community guidelines"}`);
            setIsSubmitting(false);
            return;
          }
        } catch (moderationError) {
          console.warn("Moderation check failed, continuing:", moderationError);
        }
      }

      let imageUrl: string | undefined;

      // Upload image if present
      if (imageFile) {
        try {
          const uploadResult = await uploadImage(imageFile);
          imageUrl = uploadResult.secure_url;
        } catch (uploadError) {
          console.error("Image upload error:", uploadError);
          toast.error("Failed to upload image to Cloudinary");
          setIsSubmitting(false);
          return;
        }
      }

      const finalMediaUrl = imageUrl || videoUrl || undefined;

      // Get user profile for college info
      const userCollegeName = userProfile?.college || null;

      // Call backend service for post creation and ML processing
      try {
        const hashtags = (content.match(/#[a-z0-9_]+/gi) || []).map(tag => tag.slice(1));
        const newPost = await backendService.createPost(
          content.trim(),
          postType,
          hashtags,
          finalMediaUrl,
          imageUrl ? "image" : videoUrl ? "video" : "none"
        );
        
        // Wait for backend to return the created post id
        const postId = newPost.id;
        
        // Track post created event
        if (postId) {
          trackPostCreated(user.uid, postId, postType);
        }
      } catch (backendError: any) {
        console.error("Backend service error:", backendError);
        const errorMsg = backendError.response?.data?.error || backendError.message || "Failed to create post";
        toast.error(`Error: ${errorMsg}`);
        setIsSubmitting(false);
        return;
      }

      // Reset form
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setVideoUrl(null);
      setVideoThumbnail(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Post created successfully!");

      if (onPostCreated) {
        onPostCreated();
      }
    } catch (error: any) {
      console.error("Create post error:", error);

      // Log error with context
      handleError(error, {
        userId: user.uid,
        context: 'CreatePost',
        severity: 'medium',
        customMessage: 'Failed to create post. Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar>
            <AvatarImage src={user.photoURL} />
            <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            {/* Feed Type Selector */}
            <Tabs value={postType} onValueChange={(value) => setPostType(value as "entertainment" | "career")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="entertainment">Entertainment</TabsTrigger>
                <TabsTrigger value="career">Career</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Content Input */}
            <Textarea
              placeholder={
                postType === "entertainment"
                  ? "What's on your mind?"
                  : "Share a career opportunity, achievement, or insight..."
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="resize-none"
            />

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Video Upload */}
            {showVideoUpload && (
              <VideoUpload
                onUpload={(url, thumbnail) => {
                  setVideoUrl(url);
                  setVideoThumbnail(thumbnail);
                  setShowVideoUpload(false);
                }}
                onCancel={() => setShowVideoUpload(false)}
              />
            )}

            {/* AI Content Tools */}
            {showAITools && (
              <Dialog>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>AI Content Tools</DialogTitle>
                  </DialogHeader>
                  <AIContentTools
                    onContentGenerated={(generatedContent) => {
                      setContent(generatedContent);
                      setShowAITools(false);
                    }}
                    onCancel={() => setShowAITools(false)}
                  />
                </DialogContent>
              </Dialog>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Photo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVideoUpload(true)}
                  disabled={isSubmitting}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAITools(true)}
                  disabled={isSubmitting}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Tools
                </Button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && !imageFile && !videoUrl)}
                className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}