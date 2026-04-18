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
  const [chats, setChats] = useState<ChatData[]>([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isWaitingForChat, setIsWaitingForChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [token, setToken] = useState<string>();
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Get Auth Token for WebSocket connection
  useEffect(() => {
    if (user) {
      user.getIdToken(true).then((t: string) => setToken(t));
    }
  }, [user]);

  // Connect to WebSocket
  const {
    isConnected,
    incomingMessages,
    clearIncomingMessages,
    typingUsers,
    aiSuggestions,
    setAiSuggestions,
    sendMessage
  } = useChatWebSocket(user?.uid, token);

  // Merge websocket incoming messages with local state
  useEffect(() => {
    if (incomingMessages.length > 0) {
      // Validate they belong to the current chat
      const renderableUpdates: Message[] = [];
      incomingMessages.forEach((msg: any) => {
        // Also verify the conversation id matches
        renderableUpdates.push({
          id: msg.id || Date.now().toString(),
          sender_id: msg.sender_id || msg.senderId || msg.sender_id,
          content: msg.content || msg.text || msg.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          is_read: false
        });
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
    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    setIsLoadingMessages(true);
    const messagesRef = collection(db!, 'chats', selectedChatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          const createdAt = data.createdAt as Timestamp;
          return {
            id: doc.id,
            sender_id: data.senderId || data.sender_id,
            content: data.text || data.content,
            timestamp: createdAt 
              ? new Date(createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            is_read: data.is_read || false
          };
        });
        setMessages(firestoreMessages);
        setIsLoadingMessages(false);
        setAiSuggestions([]); // clear suggestions on new scroll
        scrollToBottom();
      },
      (error) => {
        setIsLoadingMessages(false);
      }
    );
    return () => unsubscribe();
  }, [selectedChatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const activeChat = chats.find(c => c.id === selectedChatId);

  const handleSend = async () => {
    if (!message.trim() || !user || !selectedChatId || !activeChat) return;

    const messageText = message.trim();
    if (messageText.length > 2000) {
       toast.error("Message is too long.");
       return;
    }

    setMessage("");
    setAiSuggestions([]); // wipe tips

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

  const filteredChats = chats.filter(c => c.chat_type === chatType || (!c.chat_type && chatType === 'casual'));

  const isOtherTyping = activeChat ? typingUsers[activeChat.otherUserId] : false;

  return (
    <div className="min-h-screen bg-background">
      <div className="h-screen flex flex-col">
        <div className="border-b p-4 flex items-center justify-between bg-white shadow-sm z-20">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <div className="bg-gradient-to-r from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] bg-clip-text text-transparent font-bold">
                VERSONA
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
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search chats..." className="pl-10" />
              </div>
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

                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-4 max-w-3xl mx-auto">
                     {messages.length === 0 ? (
                         <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-[#FFB88C]/20 to-[#FF6F91]/20 rounded-full flex items-center justify-center mb-4">
                                <Smile className="h-8 w-8 text-[#FF6F91]" />
                            </div>
                            <h4 className="font-semibold text-sm mb-2">No messages yet</h4>
                         </div>
                     ) : (
                         messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender_id === user?.uid ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${msg.sender_id === user?.uid ? "bg-gradient-to-br from-[#FFB88C] to-[#FF6F91] text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"}`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <p className={`text-[10px] ${msg.sender_id === user?.uid ? "text-white/70" : "text-muted-foreground"}`}>{msg.timestamp}</p>
                              </div>
                            </div>
                          </div>
                        ))
                     )}
                     {isOtherTyping && (
                         <div className="flex justify-start">
                           <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-tl-none">
                             <p className="text-xs text-gray-500 italic">Typing...</p>
                           </div>
                         </div>
                     )}
                     <div ref={messagesEndRef}></div>
                  </div>
                </ScrollArea>

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
    </div>
  );
}