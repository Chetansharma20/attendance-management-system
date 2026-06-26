import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { useAskAiAssistantMutation, ChatMessage } from '../../redux/api/aiApi';
import { MessageSquare, X, Send, Sparkles, Loader2, User } from 'lucide-react';

export default function AiChatAssistant() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const userRole = currentUser?.role;

  const [askAi, { isLoading }] = useAskAiAssistantMutation();
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to the bottom of chat history when new messages arrive
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen]);

  // Load welcome message on init
  useEffect(() => {
    if (currentUser) {
      setChatHistory([
        {
          role: 'model',
          parts: [
            {
              text: `Hello ${currentUser.name}! I am your AI HR Assistant. You can ask me questions about shift timings, check-in policies, or retrieve live stats like leaves and attendance. How can I help you today?`
            }
          ]
        }
      ]);
    }
  }, [currentUser]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const newUserMessage: ChatMessage = {
      role: 'user',
      parts: [{ text: textToSend }]
    };

    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    setMessage('');

    try {
      const historyToSend = updatedHistory[0]?.role === 'model' ? updatedHistory.slice(1) : updatedHistory;
      const response = await askAi({ history: historyToSend }).unwrap();
      const aiText = response.data?.response || "I couldn't process that query. Please try again.";
      
      setChatHistory([
        ...updatedHistory,
        {
          role: 'model',
          parts: [{ text: aiText }]
        }
      ]);
    } catch (err: any) {
      setChatHistory([
        ...updatedHistory,
        {
          role: 'model',
          parts: [{ text: `Error: ${err?.data?.message || err?.error || 'Failed to connect to the AI service.'}` }]
        }
      ]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(message);
  };

  const handleChipClick = (presetMsg: string) => {
    handleSendMessage(presetMsg);
  };

  // Define preset prompt chips based on roles
  const getPresetChips = () => {
    const common = [
      { label: 'Clock-in Policy ⏰', prompt: 'What is the company policy for clocking in?' },
      { label: 'My profile 👤', prompt: 'Show my profile details.' },
      { label: 'My Attendance 📅', prompt: 'Show me my attendance history for this month.' },
    ];
    const manager = [
      { label: 'Who is late today? ⏳', prompt: 'Who is late today?' },
      { label: 'Pending Leaves 📝', prompt: 'Show pending leave requests.' },
    ];

    if (userRole === 'manager' || userRole === 'admin') {
      return [...common, ...manager];
    }
    return common;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group relative overflow-hidden"
          title="Ask HR Assistant"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <MessageSquare className="w-6 h-6 animate-pulse group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Glassmorphic Chat Drawer */}
      {isOpen && (
        <div className="w-[360px] sm:w-[400px] h-[550px] rounded-3xl backdrop-blur-lg bg-slate-900/90 dark:bg-slate-950/95 border border-white/10 dark:border-slate-800/40 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 transform scale-100 origin-bottom-right">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-violet-500/20 text-violet-400 rounded-lg">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">AI HR Assistant</h4>
                <span className="text-[10px] text-violet-300/80 font-semibold tracking-wider uppercase">Context Injected</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {chatHistory.map((chat, idx) => {
              const isAi = chat.role === 'model';
              return (
                <div key={idx} className={`flex items-start gap-2.5 ${isAi ? '' : 'flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isAi ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20' : 'bg-slate-800 text-slate-300'}`}>
                    {isAi ? 'AI' : <User className="w-4.5 h-4.5" />}
                  </div>

                  {/* Message bubble */}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${isAi ? 'bg-white/5 text-slate-200 border border-white/5 rounded-tl-none' : 'bg-violet-600 text-white rounded-tr-none shadow-md'}`}>
                    <p className="whitespace-pre-wrap font-medium">{chat.parts[0]?.text}</p>
                  </div>
                </div>
              );
            })}
            
            {/* Loading / Typing indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-violet-600/20 text-violet-400 border border-violet-500/20 shrink-0 text-xs font-bold animate-pulse">
                  AI
                </div>
                <div className="bg-white/5 text-slate-400 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-xs font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-400" />
                  <span>AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-white/5 bg-slate-900/50 max-h-[85px] overflow-y-auto">
            {getPresetChips().map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip.prompt)}
                disabled={isLoading}
                className="text-[10px] font-semibold bg-white/5 hover:bg-white/10 disabled:opacity-50 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-white/5 transition-all cursor-pointer truncate max-w-[200px]"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-slate-900/90 flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask anything about HR policy or stats..."
              disabled={isLoading}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-55 font-medium"
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </div>
  );
}
