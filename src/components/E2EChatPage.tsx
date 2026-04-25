import React, { useState, useEffect } from 'react';
import { E2EChatList } from './chat/E2EChatList';
import { E2EChatWindow } from './chat/E2EChatWindow';
import { useAuth } from '../hooks/useAuth';
import { e2eChatService } from '../lib/e2eChatService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ShieldCheck } from 'lucide-react';
import { apiClient } from '../lib/apiClient';
import { useCrypto } from '../hooks/useCrypto';

export function E2EChatPage() {
  const { user } = useAuth();
  const { isReady, publicKeyJwk } = useCrypto();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<any | null>(null);

  // Sync public key with backend
  useEffect(() => {
    async function syncKey() {
      if (user && isReady && publicKeyJwk) {
        try {
          const pubKeyStr = JSON.stringify(publicKeyJwk);
          await apiClient.post('/users/sync-user', { public_key: pubKeyStr });
          console.log('Public key synced successfully');
        } catch (error) {
          console.error('Failed to sync public key', error);
        }
      }
    }
    syncKey();
  }, [user, isReady, publicKeyJwk]);

  // Load conversations (for simplicity, we'll just load all users except self, or you could query 'e2echats' where user is participant)
  useEffect(() => {
    async function fetchConversations() {
      if (!user) return;
      try {
        // Fetch users to chat with (just an example, fetching top users)
        const q = query(collection(db, 'users'), where('uid', '!=', user.uid));
        const snap = await getDocs(q);
        const users = snap.docs.map(doc => doc.data());
        setConversations(users);
      } catch (error) {
        console.error('Error fetching users for E2E chat', error);
      }
    }
    fetchConversations();
  }, [user]);

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] mt-16 bg-slate-900 border-t border-slate-800">
      <E2EChatList 
        conversations={conversations} 
        onSelect={setActiveRecipient} 
        activeChatId={activeRecipient?.uid || null} 
      />
      {activeRecipient ? (
        <E2EChatWindow currentUser={user} recipient={activeRecipient} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
          <ShieldCheck className="w-16 h-16 mb-4 text-emerald-500/50" />
          <h2 className="text-xl font-semibold text-slate-300">End-to-End Encrypted Chat</h2>
          <p className="mt-2 text-sm max-w-md text-center">
            Select a conversation to start messaging securely. Your messages are encrypted locally and can only be decrypted by the recipient.
          </p>
        </div>
      )}
    </div>
  );
}
