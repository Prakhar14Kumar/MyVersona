import { useState } from 'react';
import { UserX, AlertTriangle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../contexts/AppContext';

interface BlockDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  isBlocked?: boolean;
}

export function BlockDialog({ open, onClose, userId, username, isBlocked = false }: BlockDialogProps) {
  const [processing, setProcessing] = useState(false);
  const { user } = useApp();

  const handleBlock = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      setProcessing(true);

      // Add to blocked users list
      const currentUserRef = doc(db, 'users', user.uid);
      await updateDoc(currentUserRef, {
        blockedUsers: arrayUnion(userId)
      });

      // Also remove from followers/following
      await updateDoc(currentUserRef, {
        following: arrayRemove(userId)
      }).catch(() => {});

      const blockedUserRef = doc(db, 'users', userId);
      await updateDoc(blockedUserRef, {
        followers: arrayRemove(user.uid)
      }).catch(() => {});

      toast.success(`${username} has been blocked`);
      onClose();
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUnblock = async () => {
    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      setProcessing(true);

      const currentUserRef = doc(db, 'users', user.uid);
      await updateDoc(currentUserRef, {
        blockedUsers: arrayRemove(userId)
      });

      toast.success(`${username} has been unblocked`);
      onClose();
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-500" />
            {isBlocked ? 'Unblock' : 'Block'} {username}?
          </DialogTitle>
          <DialogDescription>
            {isBlocked 
              ? `You will be able to see ${username}'s content again.`
              : `${username} will no longer be able to:`
            }
          </DialogDescription>
        </DialogHeader>

        {!isBlocked && (
          <div className="space-y-3">
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>See your posts or profile</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Send you messages</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Comment on your posts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-400">•</span>
                <span>Follow you or see when you're online</span>
              </li>
            </ul>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                {username} won't be notified that you blocked them.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={processing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={isBlocked ? handleUnblock : handleBlock}
            disabled={processing}
            className={`flex-1 ${isBlocked ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
          >
            {processing 
              ? 'Processing...' 
              : isBlocked 
                ? 'Unblock' 
                : 'Block User'
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
