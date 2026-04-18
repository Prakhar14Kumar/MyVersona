import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface TypingState {
  [userId: string]: {
    isTyping: boolean;
    timestamp: number;
  };
}

export function useTypingIndicator(chatId: string | null, currentUserId: string | null) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Listen for typing indicators from other users
  useEffect(() => {
    if (!chatId || !currentUserId) return;

    const chatRef = doc(db, 'chats', chatId);
    
    const unsubscribe = onSnapshot(chatRef, (snapshot) => {
      if (!snapshot.exists()) return;
      
      const data = snapshot.data();
      const typingState = data.typing as TypingState || {};
      
      // Filter out current user and expired typing indicators
      const now = Date.now();
      const activeTypingUsers = Object.entries(typingState)
        .filter(([userId, state]) => {
          return userId !== currentUserId && 
                 state.isTyping && 
                 now - state.timestamp < 5000; // 5 second timeout
        })
        .map(([userId]) => userId);
      
      setTypingUsers(activeTypingUsers);
    });

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  // Send typing indicator when user types
  const setTyping = async (isTyping: boolean) => {
    if (!chatId || !currentUserId) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (isTyping) {
        // Update typing state
        await updateDoc(chatRef, {
          [`typing.${currentUserId}`]: {
            isTyping: true,
            timestamp: Date.now()
          }
        });

        // Auto-clear after 3 seconds
        typingTimeoutRef.current = setTimeout(async () => {
          await updateDoc(chatRef, {
            [`typing.${currentUserId}`]: {
              isTyping: false,
              timestamp: Date.now()
            }
          });
        }, 3000);
      } else {
        // Clear typing state
        await updateDoc(chatRef, {
          [`typing.${currentUserId}`]: {
            isTyping: false,
            timestamp: Date.now()
          }
        });
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    typingUsers,
    setTyping
  };
}
