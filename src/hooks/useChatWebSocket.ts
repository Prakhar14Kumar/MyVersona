import { useState, useEffect, useCallback, useRef } from 'react';


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

export function useChatWebSocket(userId: string | undefined, token: string | undefined) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingMessages, setIncomingMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const MAX_RECONNECT_ATTEMPTS = 5;
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (!userId || !token) return;

    // Use environment variable for backend URL or default to localhost
    const wsUrl = (import.meta as any).env.VITE_WS_URL || 'ws://localhost:8000';
    const ws = new WebSocket(`${wsUrl}/ws/chat/${userId}?token=${token}`);

    ws.onopen = () => {
      console.log('[ChatWebSocket] Connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[ChatWebSocket] Received message:', data);
        
        switch (data.type) {
          case 'connection_established':
            break;
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
            // Assume the response string might contain suggestions
            setAiSuggestions([data.response]);
            break;
          case 'error':
            console.error('[ChatWebSocket] Error:', data.message);
            break;
        }
      } catch (error) {
        console.error('[ChatWebSocket] Message parsing error:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('[ChatWebSocket] Disconnected', event.code, event.reason);
      setIsConnected(false);
      
      // Auto-reconnect logic
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && event.code !== 1008) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttemptsRef.current++;
          connect();
        }, 1000 * Math.pow(2, reconnectAttemptsRef.current));
      }
    };

    ws.onerror = (error) => {
      console.error('[ChatWebSocket] Connection error:', error);
    };

    setSocket(ws);
  }, [userId, token]);

  useEffect(() => {
    if (userId && token) {
      connect();
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socket) {
        socket.close(1000, "Component unmounting");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, token]);

  const sendMessage = useCallback((payload: ChatMessagePayload) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(payload));
    } else {
      console.error('[ChatWebSocket] Cannot send message: Not connected');
    }
  }, [socket, isConnected]);

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
