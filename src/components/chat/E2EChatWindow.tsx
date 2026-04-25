import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { e2eChatService, E2EMessage } from '../../lib/e2eChatService';
import { useCrypto } from '../../hooks/useCrypto';
import { Lock, Send, ShieldAlert, ShieldCheck } from 'lucide-react';

interface ChatWindowProps {
  currentUser: any;
  recipient: any;
}

export function E2EChatWindow({ currentUser, recipient }: ChatWindowProps) {
  const [messages, setMessages] = useState<(E2EMessage & { plaintext?: string })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { isReady, encryptMessage, decryptMessage } = useCrypto();

  const chatId = e2eChatService.getChatId(currentUser.uid, recipient.uid);

  useEffect(() => {
    if (!recipient || !isReady) return;

    const unsubscribe = e2eChatService.subscribeToMessages(chatId, async (fetchedMessages) => {
      // Decrypt incoming messages
      const decryptedMessages = await Promise.all(
        fetchedMessages.map(async (msg) => {
          if (msg.senderId === currentUser.uid) {
            // It's our own message, ideally we'd also store a copy encrypted with our own public key, 
            // but for simplicity in this demo, we'll try decrypting it (which will fail if it was encrypted only with recipient's PK).
            // A production E2EE system encrypts the symmetric key for both sender and receiver.
            // For this basic RSA-OAEP demo, we won't be able to decrypt our own sent messages easily unless we stored them separately.
            // Let's just show a placeholder for our own sent messages or if decryption fails.
            return { ...msg, plaintext: "[Message sent securely]" };
          } else {
            const pt = await decryptMessage(msg.ciphertext);
            return { ...msg, plaintext: pt };
          }
        })
      );
      setMessages(decryptedMessages);
    });

    return () => unsubscribe();
  }, [chatId, recipient, isReady, decryptMessage, currentUser.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isEncrypting || !isReady) return;

    try {
      setIsEncrypting(true);
      // Fetch recipient's public key
      const pubKey = await e2eChatService.getPublicKey(recipient.uid);
      if (!pubKey) {
        alert("User hasn't generated encryption keys yet. Cannot send secure message.");
        setIsEncrypting(false);
        return;
      }

      const ciphertext = await encryptMessage(pubKey, newMessage.trim());
      
      await e2eChatService.sendMessage(chatId, currentUser.uid, ciphertext, recipient.uid);
      
      setNewMessage('');
    } catch (err) {
      console.error("Failed to send encrypted message:", err);
      alert("Failed to encrypt/send message.");
    } finally {
      setIsEncrypting(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900">
        <div className="text-slate-400 flex flex-col items-center">
          <Lock className="w-8 h-8 mb-4 animate-pulse" />
          <p>Initializing Crypto Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900 h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between backdrop-blur-sm z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
            {recipient.avatar_url ? (
              <img src={recipient.avatar_url} alt={recipient.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                {recipient.full_name?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-medium text-slate-200">{recipient.full_name}</h2>
            <div className="flex items-center text-xs text-emerald-400 mt-0.5 space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm
                    ${isMe 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                    }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-inter">
                    {msg.plaintext}
                  </p>
                  <div className={`text-[10px] mt-1.5 flex items-center ${isMe ? 'text-blue-200' : 'text-slate-500'}`}>
                    <Lock className="w-2.5 h-2.5 mr-1" />
                    {msg.timestamp ? new Date(msg.timestamp.toMillis()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Sending...'}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <form onSubmit={handleSend} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type an encrypted message..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-5 py-3 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isEncrypting}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isEncrypting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5 -ml-0.5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
