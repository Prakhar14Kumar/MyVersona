import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { ArrowLeft, Search, Send, Paperclip, Smile, Loader2, Sparkles, Target, PenLine, Bot } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import { collection, query, where, orderBy, onSnapshot, Timestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useChatWebSocket } from "../hooks/useChatWebSocket";

interface ChatPageProps {
  onNavigate?: (page: string) => void;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

interface ChatData {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: Timestamp;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  otherUserCollege?: string;
  chat_type: string;
  is_online?: boolean;
  is_verified?: boolean;
  unread_count?: Record<string, number>;
}

export function ChatPage({ onNavigate }: ChatPageProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const stateChatId = location.state?.chatId as string | undefined;

  const [chatType, setChatType] = useState<"casual" | "pro">("casual");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(stateChatId || null);
  const [aiHistory, setAiHistory] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [chats, setChats] = useState<ChatData[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isWaitingForChat, setIsWaitingForChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string>();
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Get Auth Token for WebSocket connection
  useEffect(() => {
    if (user) {
      user.getIdToken(true).then((t: string) => setToken(t));
      
      const savedAi = localStorage.getItem(`versona_ai_chat_history_${user.uid}`);
      if (savedAi) {
        try { setAiHistory(JSON.parse(savedAi)); } catch (e) {}
      }
    }
  }, [user]);

  const saveAiHistory = (newHistory: Message[]) => {
    setAiHistory(newHistory);
    if (user) localStorage.setItem(`versona_ai_chat_history_${user.uid}`, JSON.stringify(newHistory));
  };

  const activeChat = selectedChatId === 'versona-ai' 
    ? { id: 'versona-ai', otherUserId: 'versona-ai', otherUserName: 'Versona AI' } as ChatData 
    : chats.find(c => c.id === selectedChatId);

  const receiverId = activeChat ? activeChat.otherUserId : null;

  // Connect to WebSocket
  const {
    isConnected,
    incomingMessages,
    clearIncomingMessages,
    typingUsers,
    aiSuggestions,
    setAiSuggestions,
    sendMessage
  } = useChatWebSocket(receiverId, token);

  // Merge websocket incoming messages with local state
  useEffect(() => {
    if (incomingMessages.length > 0) {
      // Validate they belong to the current chat
      const renderableUpdates: Message[] = [];
      incomingMessages.forEach((msg: any) => {
        // Verify it belongs to the current conversation OR the currently selected receiver
        if (msg.conversation_id === selectedChatId || msg.sender_id === receiverId || msg.receiver_id === receiverId) {
            renderableUpdates.push({
              id: msg.id || Date.now().toString(),
              sender_id: msg.sender_id || msg.senderId || msg.sender_id,
              content: msg.content || msg.text || msg.message,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              is_read: false
            });
        }
      });
      
      setMessages(prev => {
        const existingIds = new Set(prev.map(m => m.id));
        const newMsgs = renderableUpdates.filter(m => !existingIds.has(m.id));
        return [...prev, ...newMsgs];
      });
      clearIncomingMessages();
      scrollToBottom();
    }
  }, [incomingMessages, clearIncomingMessages]);

  useEffect(() => {
    if (stateChatId) {
      setIsWaitingForChat(true);
      const timeout = setTimeout(() => {
        if (isWaitingForChat) {
          setIsWaitingForChat(false);
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [stateChatId]);

  const handleBack = () => {
    if (onNavigate) {
      onNavigate("feed");
    } else {
      navigate("/feed");
    }
  };

  useEffect(() => {
    if (!user) {
      setChats([]);
      setIsLoadingChats(false);
      return;
    }

    setIsLoadingChats(true);
    const chatsRef = collection(db!, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const chatsData: ChatData[] = [];
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const participants = data.participants as string[];
          const otherUserId = participants.find(id => id !== user.uid);
          
          if (otherUserId) {
            try {
              const userDocRef = doc(db!, 'users', otherUserId);
              const userDoc = await getDoc(userDocRef);
              const userData = userDoc.exists() ? userDoc.data() : null;
              
              chatsData.push({
                id: docSnap.id,
                participants,
                lastMessage: data.lastMessage || '',
                updatedAt: data.updatedAt as Timestamp,
                chat_type: data.chatType || data.chat_type || 'casual',
                otherUserId,
                otherUserName: userData?.displayName || userData?.full_name || 'Unknown User',
                otherUserAvatar: userData?.photoURL || userData?.avatar_url,
                otherUserCollege: userData?.college || userData?.college_name
              });
            } catch (error) {
              chatsData.push({
                id: docSnap.id,
                participants,
                lastMessage: data.lastMessage || '',
                updatedAt: data.updatedAt as Timestamp,
                chat_type: data.chat_type || 'casual',
                otherUserId,
                otherUserName: 'Unknown User',
              });
            }
          }
        }
        setChats(chatsData);
        setIsLoadingChats(false);

        if (stateChatId && isWaitingForChat) {
          const targetChat = chatsData.find(c => c.id === stateChatId);
          if (targetChat) {
            setSelectedChatId(stateChatId);
            setIsWaitingForChat(false);
          }
        } else if (chatsData.length > 0 && !selectedChatId && !isWaitingForChat) {
          // Select based on context
          const validChat = chatsData.find(c => chatType === 'casual' ? c.chat_type === 'casual' : c.chat_type === 'pro');
          if (validChat) setSelectedChatId(validChat.id);
        }
      },
      (error) => {
        setIsLoadingChats(false);
      }
    );
    return () => unsubscribe();
  }, [user, chatType]);

  useEffect(() => {
    if (!selectedChatId || selectedChatId === 'versona-ai' || selectedChatId.startsWith('temp-')) {
      if (selectedChatId !== 'versona-ai') setMessages([]);
      return;
    }

    const fetchHistory = async () => {
      setIsLoadingMessages(true);
      try {
        const baseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const exactUrl = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
        
        const res = await fetch(`${exactUrl}/chat/history/${selectedChatId}?limit=100`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setMessages(json.data);
          setAiSuggestions([]); // clear suggestions on new scroll
          scrollToBottom();
        }
      } catch (err) {
        console.error("Failed to fetch chat history", err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchHistory();
  }, [selectedChatId, token]);

  // Debounced User Search
  useEffect(() => {
    if (!searchQuery.trim() || !token) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const baseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const exactUrl = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
        
        const res = await fetch(`${exactUrl}/users/chat-search?query=${searchQuery}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setSearchResults(json.data);
        }
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, aiHistory, selectedChatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };



  const handleSend = async () => {
    if (!message.trim() || !user || !selectedChatId || !activeChat) return;

    const messageText = message.trim();
    if (messageText.length > 2000) {
       toast.error("Message is too long.");
       return;
    }

    setMessage("");
    setAiSuggestions([]); // wipe tips

    if (selectedChatId === 'versona-ai') {
      const newUserMsg: Message = { id: Date.now().toString(), sender_id: user.uid, content: messageText, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), is_read: true };
      const updatedHistory = [...aiHistory, newUserMsg];
      saveAiHistory(updatedHistory);
      setIsAiTyping(true);
      scrollToBottom();

      try {
        const baseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const exactUrl = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const res = await fetch(`${exactUrl}/chat/ai/ask`, {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ query: messageText, mode: chatType }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await res.json();
        if (data.response) {
          saveAiHistory([...updatedHistory, { id: Date.now().toString(), sender_id: 'versona-ai', content: data.response, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), is_read: true }]);
        } else throw new Error("No response");
      } catch (err) {
        saveAiHistory([...updatedHistory, { id: Date.now().toString(), sender_id: 'versona-ai', content: "Sorry, I'm temporarily unavailable. Please try again.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), is_read: true }]);
      } finally {
        setIsAiTyping(false);
        scrollToBottom();
      }
      return;
    }

    // Send via WebSocket! Only use optimistic UI update if disconnected or preferred
    sendMessage({
      type: "send_message",
      receiver_id: activeChat.otherUserId,
      content: messageText,
      chat_type: chatType,
      conversation_id: selectedChatId
    });
    
    // Auto request suggestions if pro chat
    if (chatType === 'pro') {
      sendMessage({
        type: "ai_query",
        query: `Analyze this context and suggest smart follow-ups for a conversation: "${messageText}"`
      });
    }
  };

  const callAiRestApi = async (endpoint: string, promptText: string) => {
    if (!token || !promptText.trim()) return;
    setIsAiLoading(true);
    let currentToast = toast.loading("AI is thinking...");
    try {
      const baseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1';
      const exactUrl = baseUrl.endsWith('/api/v1') ? baseUrl : `${baseUrl}/api/v1`;
      
      const res = await fetch(`${exactUrl}/chat/ai/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: promptText })
      });
      
      const data = await res.json();
      if (data.response) {
        if (endpoint === 'smart-reply') {
           setAiSuggestions([data.response]); // Backend now handles multiline
        } else {
           setMessage(data.response);
        }
        toast.success("AI generated successfully!", { id: currentToast });
      } else {
        throw new Error(data.error || "No response");
      }
    } catch (err) {
      toast.error("AI request failed", { id: currentToast });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (selectedChatId && activeChat && isConnected) {
      sendMessage({
        type: "typing",
        receiver_id: activeChat.otherUserId,
        conversation_id: selectedChatId,
        is_typing: true
      });
    }
  };

  const useSuggestion = (suggestion: string) => {
    setMessage(suggestion);
  };

  const aiChat: ChatData = {
    id: 'versona-ai',
    participants: [user?.uid || '', 'versona-ai'],
    lastMessage: 'Ask me anything...',
    updatedAt: Timestamp.now(),
    otherUserId: 'versona-ai',
    otherUserName: 'Versona AI',
    otherUserAvatar: '/logo.jpg',
    chat_type: chatType,
    is_online: true,
    is_verified: true,
  };

  const filteredChats = [aiChat, ...chats.filter(c => c.chat_type === chatType || (!c.chat_type && chatType === 'casual'))];

  const isOtherTyping = activeChat && activeChat.id !== 'versona-ai' ? typingUsers[activeChat.otherUserId] : false;
  const displayMessages = selectedChatId === 'versona-ai' ? aiHistory : messages;

  return (
    <div className="flex-1 flex flex-col w-full overflow-hidden bg-background">
        <div className="border-b p-4 flex items-center justify-between bg-white shadow-sm z-20">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 cursor-pointer" onClick={handleBack}>
                <img src="/logo.jpg" alt="MyVerSona" className="h-8 w-auto rounded-lg shadow-sm" />
                <div className="text-xl font-bold bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent">
                  MyVerSona
                </div>
              </div>
              <div className="flex items-center gap-1">
                 <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
                 <span className="text-[10px] text-muted-foreground">{isConnected ? "Connected" : "Disconnected"}</span>
              </div>
            </div>
          </div>

          <Tabs value={chatType} onValueChange={(v) => { setChatType(v as any); setSelectedChatId(null); }}>
            <TabsList>
              <TabsTrigger value="casual">💬 Casual Chat</TabsTrigger>
              <TabsTrigger value="pro">🤝 Professional Chat</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-20"></div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-80 border-r bg-white flex flex-col">
            <div className="p-4 border-b relative overflow-visible z-50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users to chat..." 
                  className="pl-10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border shadow-lg z-50 max-h-64 overflow-y-auto rounded-md">
                  {isSearching ? (
                    <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No users found</div>
                  ) : (
                    searchResults.map(u => (
                      <div 
                        key={u.id} 
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b flex items-center justify-between"
                        onClick={() => {
                          console.log(`[Chat UI] 🖱️ Clicked on user: ${u.name} (${u.id})`);
                          setSearchQuery("");
                          
                          const existingChat = chats.find(c => c.otherUserId === u.id && (c.chat_type === chatType || (!c.chat_type && chatType === 'casual')));
                          if (existingChat) {
                            setSelectedChatId(existingChat.id);
                            console.log(`[Chat UI] 🧭 Navigating to existing chat: ${existingChat.id}`);
                          } else {
                            const tempChatId = `temp-${u.id}`;
                            const tempChat: ChatData = {
                              id: tempChatId,
                              participants: [user?.uid || '', u.id],
                              lastMessage: 'Start a new conversation',
                              updatedAt: Timestamp.now(),
                              otherUserId: u.id,
                              otherUserName: u.name || u.full_name || u.username,
                              otherUserAvatar: u.avatar_url || '',
                              chat_type: chatType,
                              is_online: true,
                              is_verified: false,
                            };
                            setChats(prev => [tempChat, ...prev]);
                            setSelectedChatId(tempChatId);
                            console.log(`[Chat UI] 🧭 Created temp chat for new conversation: ${tempChatId}`);
                          }
                        }}
                      >
                        <div>
                           <p className="font-medium text-sm text-gray-900">{u.name}</p>
                           {u.college && <p className="text-xs text-gray-500">{u.college}</p>}
                        </div>
                        <Badge className="h-5 px-2 bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] text-white text-[10px] whitespace-nowrap">Chat</Badge>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                {isLoadingChats ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : filteredChats.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground text-sm">No conversations yet.</div>
                ) : (
                  filteredChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedChatId(chat.id)}
                      className={`w-full p-3 rounded-lg text-left transition-colors ${
                        selectedChatId === chat.id
                          ? "bg-gradient-to-r from-[#FFB88C]/10 via-[#FF6F91]/10 to-[#6DE7C5]/10 border-l-4 border-[#FF6F91]"
                          : "hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={chat.otherUserAvatar} />
                            <AvatarFallback>{chat.otherUserName?.[0] || '?'}</AvatarFallback>
                          </Avatar>
                          {chat.is_online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium text-sm">{chat.otherUserName}</p>
                            {chat.is_verified && <Badge className="h-4 px-1 text-[10px] bg-[#FF6F91]">✓</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{chat.lastMessage || "No messages yet"}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 flex flex-col bg-[#F9FAFB]">
            {activeChat ? (
              <>
                <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={activeChat.otherUserAvatar} />
                      <AvatarFallback>{activeChat.otherUserName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm">{activeChat.otherUserName}</p>
                      <p className="text-[10px] text-muted-foreground">{isOtherTyping ? "typing..." : "Online"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                  <div className="space-y-4 max-w-3xl mx-auto">
                     {displayMessages.length === 0 ? (
                         selectedChatId === 'versona-ai' ? (
                            <div className="flex flex-col items-center justify-center p-8 max-w-lg mx-auto w-full">
                               <div className="w-20 h-20 bg-gradient-to-tr from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] rounded-3xl flex items-center justify-center text-white mb-6 shadow-lg shadow-[#FF6F91]/20">
                                 <Sparkles className="h-10 w-10" />
                               </div>
                               <h3 className="text-xl font-bold mb-2">I'm Versona AI</h3>
                               <p className="text-gray-500 text-center mb-8">How can I help you {chatType === 'pro' ? 'grow your career' : 'today'}?</p>
                               
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                                 {chatType === 'pro' ? (
                                   <>
                                     {["Help me improve my resume", "Prepare me for interviews", "Write a professional LinkedIn bio", "Explain networking strategies"].map((prompt, i) => (
                                       <Button key={i} variant="outline" className="h-auto py-3 px-4 justify-start text-left text-sm whitespace-normal hover:border-[#6DE7C5] hover:bg-[#6DE7C5]/5" onClick={() => setMessage(prompt)}>
                                         {prompt}
                                       </Button>
                                     ))}
                                   </>
                                 ) : (
                                   <>
                                     {["Suggest Instagram captions", "Give me outfit ideas for a date", "What are some fun college activities?", "Tell me a joke"].map((prompt, i) => (
                                       <Button key={i} variant="outline" className="h-auto py-3 px-4 justify-start text-left text-sm whitespace-normal hover:border-[#FF6F91] hover:bg-[#FF6F91]/5" onClick={() => setMessage(prompt)}>
                                         {prompt}
                                       </Button>
                                     ))}
                                   </>
                                 )}
                               </div>
                            </div>
                         ) : (
                         <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-[#FFB88C]/20 to-[#FF6F91]/20 rounded-full flex items-center justify-center mb-4">
                                <Smile className="h-8 w-8 text-[#FF6F91]" />
                            </div>
                            <h4 className="font-semibold text-sm mb-2">No messages yet</h4>
                         </div>
                         )
                     ) : (
                         displayMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender_id === user?.uid ? "justify-end" : "justify-start"}`}>
                            {msg.sender_id === 'versona-ai' && (
                              <div className="mr-2 mt-1 flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] flex items-center justify-center text-white shadow-sm">
                                  <Sparkles className="w-4 h-4" />
                                </div>
                              </div>
                            )}
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${msg.sender_id === user?.uid ? "bg-gradient-to-br from-[#FFB88C] to-[#FF6F91] text-white rounded-tr-none" : msg.sender_id === 'versona-ai' ? "bg-white border border-gray-100 rounded-tl-none max-w-full" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"}`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <p className={`text-[10px] ${msg.sender_id === user?.uid ? "text-white/70" : "text-muted-foreground"}`}>{msg.timestamp}</p>
                              </div>
                            </div>
                          </div>
                        ))
                     )}
                     {(isOtherTyping || (selectedChatId === 'versona-ai' && isAiTyping)) && (
                         <div className="flex justify-start">
                           {selectedChatId === 'versona-ai' && (
                             <div className="mr-2 flex-shrink-0 mt-1">
                               <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] flex items-center justify-center text-white shadow-sm">
                                 <Sparkles className="w-4 h-4" />
                               </div>
                             </div>
                           )}
                           <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                             <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                           </div>
                         </div>
                     )}
                     <div ref={messagesEndRef} className="h-1 shrink-0" />
                  </div>
                </div>

                <div className="p-4 border-t bg-white shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
                  {/* Smart Replies */}
                  {aiSuggestions.length > 0 && chatType === 'pro' && (
                     <div className="flex gap-2 mb-3 max-w-3xl mx-auto overflow-x-auto pb-1 no-scrollbar">
                        {aiSuggestions[0].split('\n').slice(0, 3).map((suggestion, index) => {
                            if (!suggestion.trim()) return null;
                            const cleanText = suggestion.replace(/^[-*0-9.)]+\s*/, '');
                            return (
                                <Badge 
                                    key={index} 
                                    variant="outline" 
                                    className="cursor-pointer hover:bg-[#FF6F91]/10 bg-white shadow-sm border-[#FF6F91]/30 py-1.5 px-3 text-xs whitespace-nowrap"
                                    onClick={() => useSuggestion(cleanText)}
                                >
                                    ✨ {cleanText}
                                </Badge>
                            );
                        })}
                     </div>
                  )}

                  {/* Action Toolbar */}
                  <div className="flex gap-2 mb-3 max-w-3xl mx-auto overflow-x-auto pb-1 no-scrollbar">
                     {message.trim().length === 0 ? (
                        <>
                          <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-[#FF6F91]/10 bg-white shadow-sm border-[#FF6F91]/30 py-1.5 px-3 text-xs whitespace-nowrap flex items-center gap-1"
                              onClick={() => {
                                const lastContext = messages.slice(-3).map(m => m.content).join(" | ");
                                callAiRestApi('smart-reply', lastContext || "Hello");
                              }}
                          >
                              <Sparkles className="h-3 w-3 text-[#FF6F91]" /> Smart Reply
                          </Badge>
                          <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-purple-100 bg-white shadow-sm border-purple-300 py-1.5 px-3 text-xs whitespace-nowrap flex items-center gap-1"
                              onClick={() => {
                                 // Simple ask AI popup or use the input as question
                                 if (!message.trim()) { toast.info("Type your question below, then click Ask AI."); return; }
                              }}
                          >
                              <Bot className="h-3 w-3 text-purple-500" /> Ask AI (Type below)
                          </Badge>
                        </>
                     ) : (
                        <>
                          <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-blue-100 bg-white shadow-sm border-blue-300 py-1.5 px-3 text-xs whitespace-nowrap flex items-center gap-1"
                              onClick={() => callAiRestApi('professional', message)}
                          >
                              <Target className="h-3 w-3 text-blue-500" /> Professional
                          </Badge>
                          <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-indigo-100 bg-white shadow-sm border-indigo-300 py-1.5 px-3 text-xs whitespace-nowrap flex items-center gap-1"
                              onClick={() => callAiRestApi('improve', message)}
                          >
                              <PenLine className="h-3 w-3 text-indigo-500" /> Improve
                          </Badge>
                          <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-purple-100 bg-white shadow-sm border-purple-300 py-1.5 px-3 text-xs whitespace-nowrap flex items-center gap-1"
                              onClick={() => callAiRestApi('ask', message)}
                          >
                              <Bot className="h-3 w-3 text-purple-500" /> Ask AI
                          </Badge>
                        </>
                     )}
                  </div>

                  <div className="max-w-3xl mx-auto flex items-center gap-3 bg-gray-50 p-1.5 rounded-full border border-gray-200">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-white rounded-full">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Type a message..."
                        value={message}
                        onChange={handleTyping}
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                        className="bg-transparent border-none focus-visible:ring-0 shadow-none px-0"
                      />
                    </div>
                    <Button
                      onClick={handleSend}
                      disabled={!message.trim() || !isConnected}
                      className="bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] hover:shadow-md transition-shadow rounded-full h-10 w-10 p-0"
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white m-4 rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gradient-to-r from-[#FFB88C] to-[#FF6F91] rounded-full flex items-center justify-center text-white mb-4">
                  <Smile className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold">Select a conversation</h3>
              </div>
            )}
           </div>
        </div>
    </div>
  );
}