import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Command, Sparkles, BookOpen, FileText, MessageSquare } from 'lucide-react';
import { studySuggestions } from '../data/mockData';

export default function AIStudyCompanion() {
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I can help you summarize lectures, generate flashcards, or answer questions. How can I assist you today?' }
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const quickActions = [
    { icon: BookOpen, label: 'Summarize Lecture', color: 'from-blue-500 to-cyan-400' },
    { icon: FileText, label: 'Generate Flashcards', color: 'from-purple-500 to-pink-400' },
    { icon: MessageSquare, label: 'Ask a Question', color: 'from-green-500 to-emerald-400' },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/10 hover:border-sage-300 dark:border-white/20 transition-all"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain size={20} className="text-sage-900 dark:text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-sage-900 dark:text-white">AI Study Companion</h2>
            <p className="text-xs text-sage-500 dark:text-gray-400">Your intelligent learning assistant</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCommandOpen(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 border border-sage-300 dark:border-white/20 text-sage-600 dark:text-gray-300 hover:bg-white/15 hover:border-purple-500/50 transition-all mb-4"
        >
          <Search size={18} />
          <span className="flex-1 text-left text-sm">Ask AI anything...</span>
          <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 text-xs">
            <Command size={12} />
            <span>K</span>
          </div>
        </motion.button>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-sage-300 dark:border-white/20 transition-all"
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center`}>
                <action.icon size={18} className="text-sage-900 dark:text-white" />
              </div>
              <span className="text-xs text-sage-600 dark:text-gray-300 text-center">{action.label}</span>
            </motion.button>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-sage-900 dark:text-white mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />
            Smart Suggestions
          </h3>
          <div className="space-y-2">
            {studySuggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-purple-500/30 transition-all cursor-pointer group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-sm text-sage-600 dark:text-gray-300 group-hover:text-sage-900 dark:text-white transition-colors">{suggestion}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isCommandOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCommandOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
          >
            <motion.div
              initial={{ scale: 0.95, y: -20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-gray-900 rounded-2xl border border-sage-300 dark:border-white/20 shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-sage-200 dark:border-white/10">
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5">
                  <Search size={20} className="text-sage-500 dark:text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ask AI to summarize, explain, or generate content..."
                    className="flex-1 bg-transparent text-sage-900 dark:text-white placeholder-sage-500 dark:placeholder-gray-400 outline-none"
                    autoFocus
                  />
                </div>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className={`mb-3 ${msg.role === 'assistant' ? 'text-sage-600 dark:text-gray-300' : 'text-sage-900 dark:text-white'}`}>
                    <div className="flex items-start gap-3">
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                          <Brain size={16} className="text-sage-900 dark:text-white" />
                        </div>
                      )}
                      <p className="text-sm mt-1">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
