import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { X, Send, Bot, User, Sparkles, ShieldAlert, Loader2, Zap } from 'lucide-react';

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
      text: 'Hello! I am your Register Assistant. How can I help you query today\'s signed OPD register?',
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
        body: JSON.stringify({ message: textToSend.trim(), locale }),
      });
      if (!response.ok) throw new Error('chat_failed');
      const data = await response.json();
      setMessages((prev) => [...prev, {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: data.reply || t('chat.scopeDecline'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch (e) {
      setMessages((prev) => [...prev, {
        id: `asst_err_${Date.now()}`,
        sender: 'assistant',
        text: t('error.unknown'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false); }
  };

  const suggestions = [
    t('chat.suggestion.feverCount'),
    t('chat.suggestion.criticalList'),
    t('chat.suggestion.lastNote'),
    t('chat.suggestion.referralSlip'),
  ];

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-96 animate-fade-slide"
      style={{
        background: 'var(--neo-bg)',
        boxShadow: '-6px 0 30px rgba(0,0,0,0.18)',
      }}
      role="dialog"
      aria-label="Register Assistant"
    >
      {/* Header */}
      <div
        className="px-4 py-3.5 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #0c5560, #0d5c63)',
          boxShadow: '0 2px 12px rgba(13,92,99,0.4)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.12)', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2)' }}
          >
            <Zap className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">{t('chat.title')}</h3>
            <span className="text-[10px] font-mono" style={{ color: '#5eead4' }}>OPD Register Tool</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#5eead4' }}
          aria-label="Close chatbot"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Suggestion chips */}
      <div
        className="px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto"
        style={{ borderBottom: '1px solid rgba(163,177,198,0.3)', background: 'var(--neo-bg)' }}
      >
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s)}
            className="neo-btn whitespace-nowrap px-2.5 py-1.5 text-xs font-medium text-slate-600 shrink-0"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-3" style={{ background: 'var(--neo-bg)' }}>
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1 font-mono">
              {m.sender === 'user'
                ? <User className="w-3 h-3" />
                : <Bot className="w-3 h-3" style={{ color: 'var(--teal)' }} />
              }
              <span>{m.time}</span>
            </div>
            <div
              className="max-w-[85%] px-3.5 py-2.5 text-xs leading-relaxed"
              style={
                m.sender === 'user'
                  ? {
                      background: 'linear-gradient(135deg, #0f6b73, #0d5c63)',
                      color: 'white',
                      borderRadius: '1rem 1rem 0.25rem 1rem',
                      boxShadow: '4px 4px 10px rgba(13,92,99,0.35)',
                    }
                  : {
                      background: 'var(--neo-bg)',
                      color: 'var(--text-primary)',
                      borderRadius: '1rem 1rem 1rem 0.25rem',
                      boxShadow: 'var(--neo-shadow-sm)',
                    }
              }
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono p-2">
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--teal)' }} />
            <span>Searching register...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(163,177,198,0.3)' }}>
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={t('chat.placeholder')}
            className="neo-input flex-1 px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #0f6b73, #0d5c63)',
              color: 'white',
              boxShadow: '4px 4px 10px rgba(13,92,99,0.35)',
            }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 font-semibold">
          <ShieldAlert className="w-3 h-3" />
          <span>Scope: Register queries only</span>
        </div>
      </div>
    </div>
  );
};
