import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Bookmark, ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { PostCard } from './PostCard';
import { useAuth } from '../hooks/useAuth';
import { getBookmarkedPosts, removeBookmark } from '../lib/firestoreService';
import type { Post } from '../lib/firestoreService';
import { toast } from 'sonner@2.0.3';

export function BookmarksPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
  }, [user]);

  const loadBookmarks = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const bookmarkedPosts = await getBookmarkedPosts(user.uid, 50);
      setPosts(bookmarkedPosts);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId: string) => {
    if (!user?.uid) return;
    
    try {
      await removeBookmark(user.uid, postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Bookmark removed');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/feed')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bookmark className="w-6 h-6 text-[#FF6F91]" />
                Saved Posts
              </h1>
              <p className="text-sm text-gray-600">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'} saved
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-[#FF6F91] mb-4" />
            <p className="text-sm text-gray-500">Loading your saved posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 shadow-sm">
            <div className="w-20 h-20 bg-gradient-to-r from-[#FFB88C]/10 to-[#FF6F91]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bookmark className="w-10 h-10 text-[#FF6F91]" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No saved posts yet</h3>
            <p className="text-gray-500 max-w-xs mx-auto mb-6">
              Bookmark posts you want to revisit later by tapping the bookmark icon on any post.
            </p>
            <Button
              onClick={() => navigate('/feed')}
              className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5]"
            >
              Explore Feed
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <div key={post.id} className="relative group">
                <PostCard
                  post={post}
                  currentUserId={user?.uid || ''}
                  currentUserName={user?.displayName || 'User'}
                  currentUserAvatar={user?.photoURL}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm hover:bg-red-50 hover:text-red-600"
                  onClick={() => post.id && handleRemoveBookmark(post.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
