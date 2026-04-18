import { useState } from 'react';
import { MessageSquare, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { submitFeedback } from '../lib/firestoreService';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner@2.0.3';

interface FeedbackButtonProps {
  currentPage: string; // e.g., "feed", "explore", "college", etc.
}

export function FeedbackButton({ currentPage }: FeedbackButtonProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Please log in to submit feedback');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitFeedback({
        userId: user.uid,
        message: message.trim(),
        rating,
        page: currentPage,
      });

      toast.success('Thank you for your feedback! 🙏', {
        description: 'Your input helps us improve VerSona',
      });

      // Reset form
      setMessage('');
      setRating(undefined);
      setIsOpen(false);
    } catch (error: any) {
      console.error('Feedback submission error:', error);
      toast.error('Failed to submit feedback', {
        description: 'Please try again later',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        size="icon"
      >
        <MessageSquare className="h-6 w-6 text-white" />
      </Button>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-[#FF6F91]" />
              Share Your Feedback
            </DialogTitle>
            <DialogDescription>
              Help us improve VerSona! Your feedback is valuable to us. 🇮🇳
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Rating Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                How would you rate your experience? (Optional)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    disabled={isSubmitting}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        rating && star <= rating
                          ? 'fill-[#FF6F91] text-[#FF6F91]'
                          : 'text-muted-foreground'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
              {rating && (
                <p className="text-xs text-muted-foreground">
                  {rating === 5 && "Excellent! We're glad you love it! ⭐"}
                  {rating === 4 && "Great! Thanks for your support! 🎉"}
                  {rating === 3 && "Good! We'll keep improving! 💪"}
                  {rating === 2 && "Thanks! Help us understand what went wrong 🤔"}
                  {rating === 1 && "Sorry to hear that. Please tell us more 😔"}
                </p>
              )}
            </div>

            {/* Feedback Textarea */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Your Feedback <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Tell us what you think... (bugs, suggestions, features, etc.)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                disabled={isSubmitting}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {message.length} / 500 characters
              </p>
            </div>

            {/* Current Page Info */}
            <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
              📍 Feedback from: <span className="font-medium">{currentPage}</span> page
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setMessage('');
                setRating(undefined);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!message.trim() || isSubmitting}
              className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] hover:opacity-90 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
