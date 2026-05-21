import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, User, Bot, Send, Key } from 'lucide-react';
import { apiFetch } from '../utils/api';

const PREDEFINED_QA = [
  { q: "How do I improve focus?" },
  { q: "What is a 'Safe-Miss'?" },
  { q: "How heatmap colors work?" }
];

export default function StudyAssistantBot() {
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'bot'; text: string; isError?: boolean }[]>([
    { id: '1', role: 'bot', text: 'Hello! I am your Study Assistant. Ask me anything about your academic schedule, grades, or study goals.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [noApiKey, setNoApiKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, noApiKey]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsgId = Date.now().toString();
    const newMessages = [...messages, { id: userMsgId, role: 'user' as const, text }];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);
    setNoApiKey(false);

    try {
      // Send the conversation history (excluding client-only fields) to keep memory active
      const historyToSend = newMessages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const res = await apiFetch('/api/chatbot', {
        method: 'POST',
        body: JSON.stringify({ messages: historyToSend })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'NO_API_KEY') {
          setNoApiKey(true);
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: 'bot',
              text: "API Key Configuration Required.",
              isError: true
            }
          ]);
        } else if (data.error === 'RATE_LIMITED') {
          setMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              role: 'bot',
              text: "⏳ " + (data.message || "Rate limit hit. Please wait 30–60 seconds and try again."),
              isError: true
            }
          ]);
        } else {
          throw new Error(data.message || 'Failed to get response');
        }
      } else if (data.reply) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'bot',
            text: data.reply
          }
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: "Sorry, I encountered an error connecting to the AI model. Please try again later.",
          isError: true
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTyping || !inputValue.trim()) return;
    handleSendMessage(inputValue);
  };

  return (
    <div className="card-editorial flex flex-col h-[480px] overflow-hidden flex-1 relative">
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <Sparkles size={18} className="text-[#8aaca5]" />
        <h2 className="text-xl section-title m-0">Study Assistant</h2>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pr-2 pb-4" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                msg.role === 'bot' 
                  ? msg.isError ? 'bg-red-800 text-white' : 'bg-[#2d4f47] text-white' 
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {msg.role === 'bot' ? <Bot size={12} /> : <User size={12} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-sm' 
                  : msg.isError
                    ? 'bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 rounded-tl-sm font-sans'
                    : 'bg-[#2d4f47]/5 dark:bg-white/5 border border-[#2d4f47]/10 dark:border-white/10 text-slate-700 dark:text-slate-300 rounded-tl-sm'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#2d4f47] text-white flex items-center justify-center flex-shrink-0 mt-1">
                <Bot size={12} />
              </div>
              <div className="p-3 rounded-2xl bg-[#2d4f47]/5 dark:bg-white/5 border border-[#2d4f47]/10 dark:border-white/10 rounded-tl-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-[#8aaca5] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-[#8aaca5] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-[#8aaca5] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}

          {noApiKey && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/55 dark:border-amber-500/25 rounded-2xl text-xs text-amber-800 dark:text-amber-300 space-y-3 font-sans"
            >
              <div className="flex items-center gap-2 font-semibold">
                <Key size={14} className="text-amber-600 dark:text-amber-400" />
                <span>AI Setup Tutorial</span>
              </div>
              <p className="leading-relaxed">
                Unlock real-time academic answers by adding an API key to your root <strong>.env</strong> file:
              </p>
              <pre className="bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto text-[10px] font-mono select-all">
                GEMINI_API_KEY=your_gemini_api_key_here
              </pre>
              <p className="text-[10px] opacity-80 leading-snug">
                Get a free key from Google AI Studio. You can also configure <code>OPENAI_API_KEY</code> to use OpenAI instead!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggested Starter Chips */}
      <div className="flex-shrink-0 pt-2 border-t border-slate-200 dark:border-white/10">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {PREDEFINED_QA.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(item.q)}
              disabled={isTyping}
              className="text-left text-[11px] py-1.5 px-3 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
            >
              {item.q}
            </button>
          ))}
        </div>

        {/* Dynamic Chat Input Bar */}
        <form onSubmit={handleFormSubmit} className="relative flex items-center bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-full px-3 py-1 focus-within:border-[#8aaca5] transition-all">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? "AI is thinking..." : "Ask your Study Assistant..."}
            className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 py-1.5 px-1 min-w-0"
          />
          <button
            type="submit"
            disabled={isTyping || !inputValue.trim()}
            className="p-1.5 rounded-full bg-[#2d4f47] text-white hover:opacity-90 disabled:opacity-30 disabled:hover:opacity-30 transition-all flex-shrink-0"
          >
            <Send size={12} />
          </button>
        </form>
      </div>
    </div>
  );
}
