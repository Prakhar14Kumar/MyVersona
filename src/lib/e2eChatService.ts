import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  getDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';

export interface E2EMessage {
  id: string;
  senderId: string;
  ciphertext: string;
  timestamp: Timestamp | null;
  nonce?: string;
}

export const e2eChatService = {
  // Generate a consistent Chat ID for two users
  getChatId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  },

  // Fetch a user's public key from the users collection
  async getPublicKey(uid: string): Promise<string | null> {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data().public_key || null;
    }
    return null;
  },

  // Send an encrypted message
  async sendMessage(
    chatId: string, 
    senderId: string, 
    ciphertext: string, 
    receiverId: string
  ): Promise<void> {
    // Ensure the chat document exists (useful for querying active chats later)
    const chatRef = doc(db, 'e2echats', chatId);
    await setDoc(chatRef, {
      participants: [senderId, receiverId],
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // Add the message to the subcollection
    const messagesRef = collection(db, 'e2echats', chatId, 'messages');
    await addDoc(messagesRef, {
      senderId,
      ciphertext,
      timestamp: serverTimestamp()
    });
  },

  // Listen to messages in real-time
  subscribeToMessages(
    chatId: string, 
    callback: (messages: E2EMessage[]) => void
  ): () => void {
    const messagesRef = collection(db, 'e2echats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: E2EMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as E2EMessage);
      });
      callback(messages);
    });

    return unsubscribe;
  }
};
