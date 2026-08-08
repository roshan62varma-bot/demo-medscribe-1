import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { X, Send, Bot, User, ShieldAlert, Loader2, Zap, Mic, Square, RotateCcw } from 'lucide-react';
import { startVoiceCapture, stopVoiceCapture } from '../lib/voiceCapture';

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

async function fetchGreeting(): Promise<string> {
  try {
    const res = await fetch('/api/register');
    if (!res.ok) throw new Error('fail');
    const data = await res.json();
    const lines: any[] = data.lines || [];
    const total = lines.length;
    if (total === 0) {
      return "No notes signed yet today. Sign patient notes from Capture and I'll help you query them — counts, vitals, urgency breakdown, referral slips, and more.";
    }
    const critical = lines.filter((l: any) => l.urgency === 'CRITICAL').length;
    const urgent   = lines.filter((l: any) => l.urgency === 'URGENT').length;
    const routine  = lines.filter((l: any) => l.urgency === 'ROUTINE').length;
    const criticalNames = lines
      .filter((l: any) => l.urgency === 'CRITICAL')
      .map((l: any) => l.payload?.clinical_note?.patient_name || 'Patient')
      .join(', ');
    let msg = `Today's register has ${total} signed ${total === 1 ? 'entry' : 'entries'} — ${critical} Critical, ${urgent} Urgent, ${routine} Routine.`;
    if (critical > 0) msg += `\n⚠️ Critical: ${criticalNames}.`;
    msg += '\n\nAsk me anything — patient details, vitals, shift summary, or I can draft a referral slip.';
    return msg;
  } catch {
    return "I'm your Register Assistant. Ask me about today's signed patients, urgency breakdown, vitals, or shift summary.";
  }
}

export const RegisterChatbot: React.FC<RegisterChatbotProps> = ({ isOpen, onClose }) => {
  const { t, locale, bcp47 } = useLanguage();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages]         = useState<ChatMsg[]>([]);
  const [loading, setLoading]           = useState(false);
  const [isRecording, setIsRecording]   = useState(false);
  const [voiceError, setVoiceError]     = useState<string | null>(null);

  const historyRef    = useRef<{ role: string; text: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef      = useRef<HTMLInputElement>(null);

  // ── Load greeting when panel opens ───────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setMessages([]);
    historyRef.current = [];
    fetchGreeting().then((text) => {
      const greeting: ChatMsg = {
        id: 'init_1',
        sender: 'assistant',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([greeting]);
      historyRef.current = [{ role: 'assistant', text }];
    });
  }, [isOpen]);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Clean up voice on close ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      stopVoiceCapture();
      setIsRecording(false);
    }
  }, [isOpen]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    const nextHistory = [...historyRef.current, { role: 'user', text: trimmed }];
    historyRef.current = nextHistory;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          locale,
          history: nextHistory.slice(-10),
        }),
      });
      if (!response.ok) throw new Error('chat_failed');
      const data = await response.json();
      const replyText = data.reply || t('chat.scopeDecline');

      setMessages((prev) => [...prev, {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      historyRef.current = [...historyRef.current, { role: 'assistant', text: replyText }];
    } catch {
      setMessages((prev) => [...prev, {
        id: `asst_err_${Date.now()}`,
        sender: 'assistant',
        text: t('error.unknown'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, locale, t]);

  // ── Voice toggle ──────────────────────────────────────────────────────────
  const handleToggleVoice = useCallback(() => {
    if (isRecording) {
      stopVoiceCapture();
      setIsRecording(false);
      return;
    }
    setVoiceError(null);
    startVoiceCapture(bcp47, {
      onStart: () => setIsRecording(true),
      onResult: (text) => {
        setIsRecording(false);
        if (text) sendMessage(text);
      },
      onError: (errCode) => {
        setIsRecording(false);
        if (errCode === 'NOT_ALLOWED') setVoiceError(t('error.NOT_ALLOWED'));
        else if (errCode === 'BROWSER_UNSUPPORTED') setVoiceError(t('error.BROWSER_UNSUPPORTED'));
        else if (errCode !== 'no-speech' && errCode !== 'aborted') setVoiceError(t('error.NO_SPEECH'));
      },
      onEnd: () => setIsRecording(false),
    });
  }, [isRecording, bcp47, sendMessage, t]);

  const handleClearChat = useCallback(() => {
    historyRef.current = [];
    setVoiceError(null);
    fetchGreeting().then((text) => {
      setMessages([{
        id: `init_${Date.now()}`,
        sender: 'assistant',
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
      historyRef.current = [{ role: 'assistant', text }];
    });
  }, []);

  const suggestions = [
    t('chat.suggestion.feverCount'),
    t('chat.suggestion.criticalList'),
    t('chat.suggestion.lastNote'),
    t('chat.suggestion.referralSlip'),
  ];

  // ── ALL hooks are above this line — safe to conditionally render ──────────
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 flex flex-col w-full sm:w-[400px] animate-fade-slide"
      style={{ background: 'var(--neo-bg)', boxShadow: '-8px 0 40px rgba(0,0,0,0.2)' }}
      role="dialog"
      aria-label="Register Assistant"
    >
      {/* ── Header ── */}
      <div
        className="px-4 py-3.5 flex items-center justify-between shrink-0"
        style={{
          background: 'linear-gradient(135deg, #0c5560, #0d5c63)',
          boxShadow: '0 2px 12px rgba(13,92,99,0.4)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ background: 'rgba(255,255,255,0.12)', boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2)' }}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-teal-800" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">{t('chat.title')}</h3>
            <span className="text-[10px] font-mono" style={{ color: '#5eead4' }}>AI · Voice enabled</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearChat}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#5eead4' }}
            title="Reset conversation"
            aria-label="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#5eead4' }}
            aria-label="Close chatbot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Suggestion chips ── */}
      <div
        className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0"
        style={{ borderBottom: '1px solid rgba(163,177,198,0.3)' }}
      >
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(s)}
            disabled={loading}
            className="neo-btn whitespace-nowrap px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shrink-0 disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 px-4 py-4 overflow-y-auto space-y-4 min-h-0">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1 font-mono">
              {m.sender === 'user'
                ? <User className="w-3 h-3" />
                : <Bot className="w-3 h-3" style={{ color: 'var(--teal)' }} />
              }
              <span>{m.time}</span>
            </div>
            <div
              className="max-w-[88%] px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap"
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
          <div className="flex items-start">
            <div
              className="flex items-center gap-2 px-3.5 py-2.5 text-xs text-slate-400 rounded-2xl rounded-tl-sm"
              style={{ background: 'var(--neo-bg)', boxShadow: 'var(--neo-shadow-sm)' }}
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--teal)' }} />
              <span className="font-mono">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Input area ── */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(163,177,198,0.3)' }}>

        {voiceError && (
          <div
            className="mb-2 px-3 py-1.5 rounded-lg text-[11px] text-rose-700 font-medium"
            style={{ background: 'rgba(220,38,38,0.08)', boxShadow: 'var(--neo-shadow-sm)' }}
          >
            {voiceError}
          </div>
        )}

        {isRecording && (
          <div
            className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.06)', boxShadow: 'var(--neo-shadow-sm)' }}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span className="text-[11px] font-semibold text-rose-600">Listening... speak your question</span>
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(inputMessage); }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={handleToggleVoice}
            disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-40"
            style={
              isRecording
                ? {
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    boxShadow: '0 0 0 6px rgba(239,68,68,0.15), 4px 4px 10px rgba(220,38,38,0.4)',
                  }
                : {
                    background: 'var(--neo-bg)',
                    color: 'var(--teal)',
                    boxShadow: 'var(--neo-shadow-sm)',
                  }
            }
            aria-label={isRecording ? 'Stop voice input' : 'Ask by voice'}
            title={isRecording ? 'Stop recording' : 'Ask by voice'}
          >
            {isRecording
              ? <Square className="w-3.5 h-3.5 fill-current" />
              : <Mic className="w-3.5 h-3.5" />
            }
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isRecording ? 'Listening...' : t('chat.placeholder')}
            disabled={isRecording}
            className="neo-input flex-1 px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 disabled:opacity-60"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || loading || isRecording}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, #0f6b73, #0d5c63)',
              color: 'white',
              boxShadow: '4px 4px 10px rgba(13,92,99,0.35)',
            }}
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-600 font-semibold">
          <ShieldAlert className="w-3 h-3" />
          <span>Scope: Register queries only · No clinical advice</span>
        </div>
      </div>
    </div>
  );
};
