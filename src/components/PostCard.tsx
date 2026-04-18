import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, MoreVertical, Flag, UserX, Bookmark } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { backendService } from "../lib/backendService";
import { toast } from "sonner@2.0.3";
import type { Post } from "../lib/firestoreService";
import { bookmarkPost, removeBookmark, isPostBookmarked } from "../lib/firestoreService";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { ReportDialog } from "./ReportDialog";
import { BlockDialog } from "./BlockDialog";
import { trackPostLiked, trackPostBookmarked } from "../lib/userBehaviorTracker";

import { useNavigate } from "react-router";

interface PostCardProps {
  post: Post;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onNavigate?: (page: string) => void;
}

export function PostCard({ post, currentUserId, currentUserName, currentUserAvatar, onNavigate }: PostCardProps) {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.likedBy?.includes(currentUserId) || false);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);

  // Check if post is bookmarked on mount
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (post.id) {
        const bookmarked = await isPostBookmarked(currentUserId, post.id);
        setIsSaved(bookmarked);
      }
    };
    checkBookmarkStatus();
  }, [currentUserId, post.id]);

  const handleLike = async () => {
    try {
      if (isLiked) {
        await backendService.unlikePost(post.id!);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await backendService.likePost(post.id!);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
        
        // Track post liked event
        trackPostLiked(currentUserId, post.id!, post.type);
      }
    } catch (error: any) {
      console.error("Like error:", error);
      toast.error("Failed to update like");
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await backendService.createComment(post.id!, commentText.trim());

      setCommentText("");
      toast.success("Comment added!");
    } catch (error: any) {
      console.error("Comment error:", error);
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleBookmark = async () => {
    if (!post.id || isBookmarkLoading) return;

    setIsBookmarkLoading(true);
    try {
      if (isSaved) {
        await removeBookmark(currentUserId, post.id);
        setIsSaved(false);
        toast.success("Post removed from bookmarks");
      } else {
        await bookmarkPost(currentUserId, post.id);
        setIsSaved(true);
        toast.success("Post saved to bookmarks");
        
        // Track post bookmarked event
        trackPostBookmarked(currentUserId, post.id, post.type);
      }
    } catch (error: any) {
      console.error("Bookmark error:", error);
      toast.error("Failed to update bookmark");
    } finally {
      setIsBookmarkLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        {/* Post Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.userAvatar} />
              <AvatarFallback>{post.userName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p>{post.userName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
                  {post.userCollege}
                </span>
                <span>•</span>
                <span>{formatTime(post.createdAt)}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {currentUserId !== post.userId && (
                <DropdownMenuItem
                  onClick={async () => {
                    try {
                      const { getOrCreateChat } = await import('../lib/chatService');
                      console.log('[PostCard] Starting chat with user:', post.userId);
                      const chatId = await getOrCreateChat(currentUserId, post.userId);
                      console.log('[PostCard] Chat created/retrieved, ID:', chatId);
                      
                      // Navigate to chat with the chatId in state
                      if (onNavigate) {
                        // Using app-level navigation
                        navigate('/chat', { state: { chatId } });
                      } else {
                        // Direct navigation (fallback)
                        navigate('/chat', { state: { chatId } });
                      }
                    } catch (error) {
                      console.error("[PostCard] Failed to start chat:", error);
                      toast.error("Failed to start conversation");
                    }
                  }}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => {
                  setShowReportDialog(true);
                }}
              >
                <Flag className="mr-2 h-4 w-4" />
                Report
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setShowBlockDialog(true);
                }}
              >
                <UserX className="mr-2 h-4 w-4" />
                Block
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleBookmark}
              >
                <Bookmark className={`mr-2 h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Saved" : "Save"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Post Content */}
        <div className="space-y-3">
          <p className="whitespace-pre-wrap">{post.content}</p>
          
          {post.image && (
            <div className="rounded-lg overflow-hidden">
              <ImageWithFallback
                src={post.image}
                alt="Post image"
                className="w-full h-auto object-cover"
              />
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={isLiked ? "text-red-500" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
              {likesCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {post.comments}
            </Button>
          </div>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="pt-3 border-t space-y-3">
            {/* Add Comment */}
            <div className="flex gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUserAvatar} />
                <AvatarFallback>{currentUserName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={1}
                  className="resize-none"
                />
                <Button
                  onClick={handleComment}
                  disabled={!commentText.trim() || isSubmittingComment}
                  size="sm"
                  className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90"
                >
                  Post
                </Button>
              </div>
            </div>

            {/* Comments would be loaded here with real-time listener */}
            <div className="text-sm text-muted-foreground text-center py-2">
              Comments load in real-time
            </div>
          </div>
        )}
      </CardContent>
      <ReportDialog
        open={showReportDialog}
        onClose={() => setShowReportDialog(false)}
        reportType="post"
        reportedId={post.id!}
        reportedName={post.userName}
      />
      <BlockDialog
        open={showBlockDialog}
        onClose={() => setShowBlockDialog(false)}
        userId={post.userId}
        username={post.userName}
      />
    </Card>
  );
}