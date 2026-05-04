import { useState, useEffect, useCallback } from 'react';

export interface ChatMessagePayload {
  type: string;
  sender_id?: string;
  receiver_id?: string;
  content?: string;
  chat_type?: string;
  conversation_id?: string;
  message?: any;
  is_typing?: boolean;
  query?: string;
  response?: string;
}

export function useChatWebSocket(receiverId: string | null | undefined, token: string | undefined) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingMessages, setIncomingMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  useEffect(() => {
    let wsInstance: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    const connect = () => {
      // Only connect if we have BOTH a receiver and an auth token
      if (!receiverId || !token) return;

      const wsUrl = (import.meta as any).env.VITE_WS_URL || 'ws://localhost:8000';
      const url = `${wsUrl}/ws/chat/${receiverId}?token=${token}`;
      console.log(`[WebSocket] 🔌 Attempting connection to: ${url}`);
      
      wsInstance = new WebSocket(url);

      wsInstance.onopen = () => {
        console.log(`[WebSocket] ✅ Connected to chat with receiver: ${receiverId}`);
        setIsConnected(true);
        attempts = 0;
      };

      wsInstance.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] 📥 Received message:', data);
          
          switch (data.type) {
            case 'new_message':
            case 'message_sent':
              setIncomingMessages(prev => [...prev, data.message]);
              break;
            case 'typing':
              setTypingUsers(prev => ({
                ...prev,
                [data.sender_id]: data.is_typing
              }));
              break;
            case 'ai_response':
              setAiSuggestions([data.response]);
              break;
          }
        } catch (error) {
          console.error('[WebSocket] Message parsing error:', error);
        }
      };

      wsInstance.onclose = (event) => {
        console.log(`[WebSocket] ❌ Disconnected. Code: ${event.code}, Reason: ${event.reason}`);
        setIsConnected(false);
        
        // Auto-reconnect logic
        if (attempts < MAX_ATTEMPTS && event.code !== 1008) {
          reconnectTimeout = setTimeout(() => {
            attempts++;
            connect();
          }, 1000 * Math.pow(2, attempts));
        }
      };

      wsInstance.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
      };

      setSocket(wsInstance);
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (wsInstance) {
        console.log('[WebSocket] 🧹 Cleaning up old connection');
        wsInstance.close(1000, "Component unmounting or receiver changed");
      }
    };
  }, [receiverId, token]);

  const sendMessage = useCallback((payload: any) => {
    if (socket && isConnected) {
      console.log('[WebSocket] 📤 Sending payload:', payload);
      socket.send(JSON.stringify(payload));
    } else {
      console.error('[WebSocket] Cannot send message: Not connected');
    }
  }, [socket, isConnected, receiverId]);

  const clearIncomingMessages = useCallback(() => {
    setIncomingMessages([]);
  }, []);

  return {
    isConnected,
    incomingMessages,
    clearIncomingMessages,
    typingUsers,
    aiSuggestions,
    setAiSuggestions,
    sendMessage
  };
}
