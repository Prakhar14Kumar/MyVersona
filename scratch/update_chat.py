import os

file_path = r"f:\MyVersona\src\components\ChatPage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State changes
state_old = """  const [chatType, setChatType] = useState<"casual" | "pro">("casual");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(stateChatId || null);"""

state_new = """  const [chatType, setChatType] = useState<"casual" | "pro">("casual");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(stateChatId || null);
  const [aiHistory, setAiHistory] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);"""
content = content.replace(state_old, state_new)

# 2. LocalStorage Handling
storage_old = """  // Get Auth Token for WebSocket connection
  useEffect(() => {
    if (user) {
      user.getIdToken(true).then((t: string) => setToken(t));
    }
  }, [user]);

  // Connect to WebSocket"""

storage_new = """  // Get Auth Token for WebSocket connection
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

  // Connect to WebSocket"""
content = content.replace(storage_old, storage_new)

# 3. Handle activeChat and handleSend
send_old = """  const activeChat = chats.find(c => c.id === selectedChatId);

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
    sendMessage({"""

send_new = """  const activeChat = selectedChatId === 'versona-ai' 
    ? { id: 'versona-ai', otherUserId: 'versona-ai', otherUserName: 'Versona AI' } as ChatData 
    : chats.find(c => c.id === selectedChatId);

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
    sendMessage({"""
content = content.replace(send_old, send_new)

# 4. Filtered chats logic
filtered_old = """  const filteredChats = chats.filter(c => c.chat_type === chatType || (!c.chat_type && chatType === 'casual'));

  const isOtherTyping = activeChat ? typingUsers[activeChat.otherUserId] : false;"""

filtered_new = """  const aiChat: ChatData = {
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
  const displayMessages = selectedChatId === 'versona-ai' ? aiHistory : messages;"""
content = content.replace(filtered_old, filtered_new)

# 5. UI Updates - replace messages with displayMessages
messages_ui_old = """                     {messages.length === 0 ? (
                         <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-[#FFB88C]/20 to-[#FF6F91]/20 rounded-full flex items-center justify-center mb-4">
                                <Smile className="h-8 w-8 text-[#FF6F91]" />
                            </div>
                            <h4 className="font-semibold text-sm mb-2">No messages yet</h4>
                         </div>
                     ) : (
                         messages.map((msg) => ("""

messages_ui_new = """                     {displayMessages.length === 0 ? (
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
                         displayMessages.map((msg) => ("""
content = content.replace(messages_ui_old, messages_ui_new)

# 6. Distinct Bubble rendering
bubble_old = """                          <div key={msg.id} className={`flex ${msg.sender_id === user?.uid ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${msg.sender_id === user?.uid ? "bg-gradient-to-br from-[#FFB88C] to-[#FF6F91] text-white rounded-tr-none" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"}`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>"""

bubble_new = """                          <div key={msg.id} className={`flex ${msg.sender_id === user?.uid ? "justify-end" : "justify-start"}`}>
                            {msg.sender_id === 'versona-ai' && (
                              <div className="mr-2 mt-1 flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFB88C] via-[#FF6F91] to-[#6DE7C5] flex items-center justify-center text-white shadow-sm">
                                  <Sparkles className="w-4 h-4" />
                                </div>
                              </div>
                            )}
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm ${msg.sender_id === user?.uid ? "bg-gradient-to-br from-[#FFB88C] to-[#FF6F91] text-white rounded-tr-none" : msg.sender_id === 'versona-ai' ? "bg-white border border-gray-100 rounded-tl-none max-w-full" : "bg-white text-gray-800 rounded-tl-none border border-gray-100"}`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>"""
content = content.replace(bubble_old, bubble_new)

# 7. Typing Indicator
typing_old = """                     {isOtherTyping && (
                         <div className="flex justify-start">
                           <div className="bg-gray-100 px-4 py-2 rounded-2xl rounded-tl-none">
                             <p className="text-xs text-gray-500 italic">Typing...</p>
                           </div>
                         </div>
                     )}"""

typing_new = """                     {(isOtherTyping || (selectedChatId === 'versona-ai' && isAiTyping)) && (
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
                     )}"""
content = content.replace(typing_old, typing_new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
