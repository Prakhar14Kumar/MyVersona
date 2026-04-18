import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Story } from '../types';
import { StorySkeleton } from './ui/skeleton-loader';
import { motion, AnimatePresence } from 'motion/react';

interface StoriesProps {
  stories: Story[];
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onCreateStory: () => void;
  isLoading?: boolean;
}

export function Stories({
  stories,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onCreateStory,
  isLoading = false,
}: StoriesProps) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [progress, setProgress] = useState(0);

  // Auto advance story after 5 seconds
  useEffect(() => {
    if (!selectedStory) return;

    setProgress(0);
    const duration = 5000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);

      if (currentStep >= steps) {
        clearInterval(timer);
        handleNext();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [selectedStory]);

  const handleNext = () => {
    if (!selectedStory) return;

    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
    if (currentIndex < stories.length - 1) {
      setSelectedStory(stories[currentIndex + 1]);
    } else {
      setSelectedStory(null);
    }
  };

  const handlePrevious = () => {
    if (!selectedStory) return;

    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
    if (currentIndex > 0) {
      setSelectedStory(stories[currentIndex - 1]);
    }
  };

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    if (!acc[story.userId]) {
      acc[story.userId] = [];
    }
    acc[story.userId].push(story);
    return {};
  }, {} as Record<string, Story[]>);

  const storyUsers = Object.keys(groupedStories).map((userId) => ({
    userId,
    userName: groupedStories[userId][0].userName,
    userAvatar: groupedStories[userId][0].userAvatar,
    stories: groupedStories[userId],
    hasUnseen: true, // TODO: Implement seen logic
  }));

  return (
    <>
      <div className="flex items-center gap-4 overflow-x-auto pb-2 hide-scrollbar">
        {/* Create Story Button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
          onClick={onCreateStory}
        >
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-border">
              <AvatarImage src={currentUserAvatar} />
              <AvatarFallback>{currentUserName[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] rounded-full flex items-center justify-center shadow-md">
              <Plus className="h-4 w-4 text-white" />
            </div>
          </div>
          <span className="text-xs truncate w-16 text-center">Your Story</span>
        </motion.div>

        {/* Loading Skeletons */}
        {isLoading && (
          <>
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
            <StorySkeleton />
          </>
        )}

        {/* Story Users */}
        {storyUsers.map((user) => (
          <motion.div
            key={user.userId}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
            onClick={() => setSelectedStory(user.stories[0])}
          >
            <div
              className={`p-0.5 rounded-full ${
                user.hasUnseen
                  ? 'bg-gradient-to-tr from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5]'
                  : 'bg-border'
              }`}
            >
              <Avatar className="h-16 w-16 border-2 border-white">
                <AvatarImage src={user.userAvatar} />
                <AvatarFallback>{user.userName[0]}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs truncate w-16 text-center">{user.userName}</span>
          </motion.div>
        ))}
      </div>

      {/* Story Viewer Dialog */}
      <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
        <DialogContent className="max-w-md p-0 bg-black border-none overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedStory && (
              <motion.div
                key={selectedStory.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
                className="relative w-full aspect-[9/16] bg-black"
              >
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
                  {stories
                    .filter((s) => s.userId === selectedStory.userId)
                    .map((story, index) => (
                      <div
                        key={story.id}
                        className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                      >
                        {story.id === selectedStory.id && (
                          <div
                            className="h-full bg-white transition-all duration-50"
                            style={{ width: `${progress}%` }}
                          />
                        )}
                      </div>
                    ))}
                </div>

                {/* Header */}
                <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4 pt-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-2 border-white">
                      <AvatarImage src={selectedStory.userAvatar} />
                      <AvatarFallback>{selectedStory.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white text-sm">{selectedStory.userName}</p>
                      <p className="text-white/70 text-xs">
                        {new Date(selectedStory.createdAt.toMillis()).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    onClick={() => setSelectedStory(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Story Media */}
                <div className="w-full h-full flex items-center justify-center">
                  {selectedStory.media.type === 'image' ? (
                    <img
                      src={selectedStory.media.url}
                      alt="Story"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <video
                      src={selectedStory.media.url}
                      className="w-full h-full object-contain"
                      autoPlay
                      muted
                      playsInline
                    />
                  )}
                </div>

                {/* Caption */}
                {selectedStory.caption && (
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-center">{selectedStory.caption}</p>
                  </div>
                )}

                {/* Navigation Areas */}
                <div className="absolute inset-0 z-10 flex">
                  <button
                    className="flex-1"
                    onClick={handlePrevious}
                    aria-label="Previous story"
                  />
                  <button
                    className="flex-1"
                    onClick={handleNext}
                    aria-label="Next story"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
