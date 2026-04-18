import { useState } from 'react';
import { AlertTriangle, Flag, MessageSquareOff, UserX, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApp } from '../contexts/AppContext';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  reportType: 'user' | 'post' | 'comment';
  reportedId: string;
  reportedName?: string;
}

const reportReasons = {
  user: [
    { value: 'spam', label: 'Spam or fake account' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'scam', label: 'Scam or fraud' },
    { value: 'other', label: 'Other' }
  ],
  post: [
    { value: 'spam', label: 'Spam or misleading' },
    { value: 'hate_speech', label: 'Hate speech or symbols' },
    { value: 'violence', label: 'Violence or dangerous content' },
    { value: 'nudity', label: 'Nudity or sexual content' },
    { value: 'false_info', label: 'False information' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'other', label: 'Other' }
  ],
  comment: [
    { value: 'spam', label: 'Spam' },
    { value: 'hate_speech', label: 'Hate speech' },
    { value: 'harassment', label: 'Harassment or bullying' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'other', label: 'Other' }
  ]
};

export function ReportDialog({ open, onClose, reportType, reportedId, reportedName }: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useApp();

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error('Please select a reason for reporting');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to report');
      return;
    }

    try {
      setSubmitting(true);

      // Add report to database
      const reportsRef = collection(db, 'reports');
      await addDoc(reportsRef, {
        reporterId: user.uid,
        reportedId,
        reportType,
        reason: selectedReason,
        details: additionalDetails.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        reviewed: false
      });

      // Increment report count on the reported entity
      if (reportType === 'user') {
        const userRef = doc(db, 'users', reportedId);
        await updateDoc(userRef, {
          reportCount: arrayUnion(user.uid)
        }).catch(() => {}); // Ignore if field doesn't exist
      } else if (reportType === 'post') {
        const postRef = doc(db, 'posts', reportedId);
        await updateDoc(postRef, {
          reportCount: arrayUnion(user.uid)
        }).catch(() => {});
      }

      toast.success('Report submitted successfully. Our team will review it.');
      resetAndClose();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedReason('');
    setAdditionalDetails('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Report {reportType === 'user' ? 'User' : reportType === 'post' ? 'Post' : 'Comment'}
          </DialogTitle>
          <DialogDescription>
            {reportedName && `Help us understand what's wrong with ${reportedName}.`}
            {!reportedName && `Help us understand what's wrong.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              False reports may result in action being taken on your account.
            </p>
          </div>

          {/* Reason Selection */}
          <div>
            <Label className="mb-3 block font-semibold">Why are you reporting this?</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              <div className="space-y-2">
                {reportReasons[reportType].map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Additional Details */}
          <div>
            <Label className="mb-2 block">Additional details (optional)</Label>
            <Textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Provide more context about why you're reporting this..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {additionalDetails.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={resetAndClose}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedReason}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
