import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Sparkles, User, Bot } from 'lucide-react';

const PREDEFINED_QA = [
  {
    q: "How do I improve focus?",
    a: "Try using the Focus Hub for 25 minutes, then take a 5-minute break. This Pomodoro technique helps prevent burnout."
  },
  {
    q: "What is a 'Safe-Miss'?",
    a: "It calculates exactly how many classes you can afford to skip while keeping your attendance strictly above 75%."
  },
  {
    q: "How do heatmap colors work?",
    a: "The dots change based on your highest priority deadline that day: High (Red), Medium (Brass), or Normal (Sage)."
  }
];

export default function StudyAssistantBot() {
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'bot'; text: string }[]>([
    { id: '1', role: 'bot', text: 'Hello! I am your Study Assistant. Select a question below if you need help navigating your dashboard.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleAsk = (q: string, a: string) => {
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: userMsgId, role: 'user', text: q }]);
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'bot', text: a }]);
    }, 600);
  };

  return (
    <div className="card-editorial flex flex-col h-[480px] overflow-hidden flex-1">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={18} className="text-[#8aaca5]" />
        <h2 className="text-xl section-title m-0">Study Assistant</h2>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-4 pr-2" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${msg.role === 'bot' ? 'bg-[#2d4f47] text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {msg.role === 'bot' ? <Bot size={12} /> : <User size={12} />}
              </div>
              <div className={`p-3 rounded-2xl text-sm max-w-[85%] leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tr-sm' 
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
        </AnimatePresence>
      </div>

      {/* Suggested Questions */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 flex flex-col gap-2">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted mb-1">Ask a question</p>
        <div className="flex flex-col gap-1.5">
          {PREDEFINED_QA.map((item, i) => (
            <button
              key={i}
              onClick={() => handleAsk(item.q, item.a)}
              disabled={isTyping}
              className="text-left text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50"
            >
              {item.q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
