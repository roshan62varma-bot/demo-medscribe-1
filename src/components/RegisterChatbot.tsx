import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { MessageSquareText, X, Send, Bot, User, Sparkles, ShieldAlert, Loader2 } from 'lucide-react';

interface RegisterChatbotProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMsg {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export const RegisterChatbot: React.FC<RegisterChatbotProps> = ({ isOpen, onClose }) => {
  const { t, locale } = useLanguage();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 'init_1',
      sender: 'assistant',
      text: t('chat.scopeDecline') ? `Hello! I am your Register Assistant. How can I help you query today's signed OPD register?` : 'Hello! I am your Register Assistant.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          locale,
        }),
      });

      if (!response.ok) throw new Error('chat_failed');

      const data = await response.json();

      const assistantMsg: ChatMsg = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || t('chat.scopeDecline'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: `asst_err_${Date.now()}`,
          sender: 'assistant',
          text: t('error.unknown'),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    t('chat.suggestion.feverCount'),
    t('chat.suggestion.criticalList'),
    t('chat.suggestion.lastNote'),
    t('chat.suggestion.referralSlip'),
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col">
      
      {/* Header */}
      <div className="p-4 bg-[#0d5c63] text-slate-100 flex items-center justify-between border-b border-[#09484e]">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#fbbf24]" />
          <div>
            <h3 className="font-bold text-sm">{t('chat.title')}</h3>
            <span className="text-[10px] text-[#2dd4bf] font-mono">OPD Register Tool</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-black/20 text-[#2dd4bf]"
          aria-label="Close chatbot"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Suggestion Chips */}
      <div className="p-3 bg-amber-50/60 dark:bg-slate-800/60 border-b border-amber-200/60 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s)}
            className="whitespace-nowrap bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-teal-50 hover:border-teal-300 transition-colors shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1 font-mono">
              {m.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-teal-600" />}
              <span>{m.time}</span>
            </div>

            <div
              className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-[#0d5c63] text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono p-2">
            <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
            <span>Searching register...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="p-2.5 bg-[#0d5c63] hover:bg-[#09484e] disabled:opacity-50 text-white rounded-xl shadow transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-amber-600 font-semibold">
            <ShieldAlert className="w-3 h-3" /> Scope: Register queries only
          </span>
        </div>
      </div>

    </div>
  );
};
