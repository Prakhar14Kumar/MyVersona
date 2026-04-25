import { 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  setDoc, 
  getDoc,
  getDocs,
  doc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { sanitizeInput } from '../utils/validation';

/**
 * Chat data structure for Firestore
 */
interface Chat {
  participants: string[];
  lastMessage: string;
  updatedAt: Timestamp;
}

/**
 * Message data structure for Firestore
 */
interface Message {
  senderId: string;
  text: string;
  createdAt: Timestamp;
}

/**
 * Get or create a chat between two users
 * 
 * @param userId1 - First user ID
 * @param userId2 - Second user ID
 * @returns Promise<string> - Chat ID
 */
export async function getOrCreateChat(userId1: string, userId2: string): Promise<string> {
  console.log('[ChatService] getOrCreateChat start:', { userId1, userId2 });
  try {
    // Validate inputs
    if (!userId1 || !userId2) {
      throw new Error('Both user IDs are required');
    }

    if (userId1 === userId2) {
      throw new Error('Cannot create chat with yourself');
    }

    // Sort participants to prevent duplicates and generate deterministic ID
    const participants = [userId1, userId2].sort();
    const chatId = `${participants[0]}_${participants[1]}`;

    // Query for existing chat using the deterministic ID
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      console.log('[ChatService] No existing chat found, creating new one for:', participants);
      const newChat: Chat = {
        participants,
        lastMessage: '',
        updatedAt: serverTimestamp() as Timestamp
      };
      
      // Use setDoc with merge to ensure atomic-like creation without overriding if created concurrently
      await setDoc(chatRef, newChat, { merge: true });
      console.log('[ChatService] New chat created successfully, ID:', chatId);
    } else {
      console.log('[ChatService] Existing chat found:', chatId);
    }

    return chatId;

  } catch (error) {
    console.error('[ChatService] Error in getOrCreateChat:', error);
    throw error;
  }
}

/**
 * Send a message in a chat
 * 
 * @param chatId - Chat ID
 * @param senderId - Sender user ID
 * @param text - Message text
 * @returns Promise<string> - Message ID
 */
export async function sendMessage(chatId: string, senderId: string, text: string): Promise<string> {
  try {
    // Validate inputs
    if (!chatId || !senderId || !text) {
      throw new Error('Chat ID, sender ID, and message text are required');
    }

    // Trim and validate text is not empty
    const trimmedText = text.trim();
    if (!trimmedText) {
      throw new Error('Message text cannot be empty');
    }

    if (trimmedText.length > 5000) {
      throw new Error('Message too long (max 5000 characters)');
    }

    // Sanitize input to prevent XSS
    const sanitizedText = sanitizeInput(trimmedText);

    // Create message in subcollection
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messageData: Message = {
      senderId,
      text: sanitizedText,
      createdAt: serverTimestamp() as Timestamp
    };

    const messageRef = await addDoc(messagesRef, messageData);

    // Update chat's lastMessage and updatedAt
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, {
      lastMessage: sanitizedText,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return messageRef.id;

  } catch (error) {
    console.error('[ChatService] Error in sendMessage:', error);
    throw error;
  }
}