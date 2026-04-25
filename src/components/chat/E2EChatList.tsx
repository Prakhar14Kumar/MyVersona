import React from 'react';

interface ChatListProps {
  conversations: any[];
  onSelect: (user: any) => void;
  activeChatId: string | null;
}

export function E2EChatList({ conversations, onSelect, activeChatId }: ChatListProps) {
  return (
    <div className="w-80 border-r border-slate-700/50 bg-slate-800/20 h-full flex flex-col">
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          Secure Chats
        </h2>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/20">
          E2EE Active
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {conversations.length === 0 ? (
          <p className="text-slate-500 text-center mt-10 text-sm">No secure chats yet.</p>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.uid}
              onClick={() => onSelect(conv)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-center space-x-3
                ${activeChatId === conv.uid 
                  ? 'bg-blue-500/20 border border-blue-500/30' 
                  : 'hover:bg-slate-800/50 border border-transparent'
                }`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden">
                {conv.avatar_url ? (
                  <img src={conv.avatar_url} alt={conv.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                    {conv.full_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="text-sm font-medium text-slate-200 truncate">{conv.full_name}</h3>
                <p className="text-xs text-slate-500 truncate">@{conv.username}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
