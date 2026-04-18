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

    // Sort participants to prevent duplicates
    const participants = [userId1, userId2].sort();

    // Query for existing chat
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', userId1));
    
    const snapshot = await getDocs(q);
    console.log('[ChatService] Query result size:', snapshot.docs.length);
    
    // Check if chat exists with both participants
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const chatParticipants = data.participants;
      
      // Data normalization: ensure it's an array
      if (Array.isArray(chatParticipants) && 
          chatParticipants.length === 2 && 
          chatParticipants.includes(userId1) && 
          chatParticipants.includes(userId2)) {
        // Chat already exists
        console.log('[ChatService] Existing chat found:', docSnap.id);
        return docSnap.id;
      }
    }

    console.log('[ChatService] No existing chat found, creating new one for:', participants);

    // Create new chat if not found
    const newChat: Chat = {
      participants,
      lastMessage: '',
      updatedAt: serverTimestamp() as Timestamp
    };

    const chatRef = await addDoc(chatsRef, newChat);
    
    if (!chatRef || !chatRef.id) {
      throw new Error('Failed to generate chat ID');
    }
    
    console.log('[ChatService] New chat created successfully, ID:', chatRef.id);
    return chatRef.id;

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

    // Create message in subcollection
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const messageData: Message = {
      senderId,
      text: trimmedText,
      createdAt: serverTimestamp() as Timestamp
    };

    const messageRef = await addDoc(messagesRef, messageData);

    // Update chat's lastMessage and updatedAt
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, {
      lastMessage: trimmedText,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return messageRef.id;

  } catch (error) {
    console.error('[ChatService] Error in sendMessage:', error);
    throw error;
  }
}