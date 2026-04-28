import { apiFetch } from '../utils/api';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Zap } from 'lucide-react';

interface FocusHubProps {
  onDeepWorkToggle: (active: boolean) => void;
}

export default function FocusHub({ onDeepWorkToggle }: FocusHubProps) {
  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isDeepWork, setIsDeepWork] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [subject, setSubject] = useState('');
  const [logMessage, setLogMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && time > 0) {
      interval = setInterval(() => {
        setTime((t) => t - 1);
      }, 1000);
    } else if (time === 0 && isRunning) {
      setIsRunning(false);
      setSessionCount((c) => c + 1);
      setTime(25 * 60);
    }
    return () => clearInterval(interval);
  }, [isRunning, time]);

  const toggleDeepWork = () => {
    const newState = !isDeepWork;
    setIsDeepWork(newState);
    onDeepWorkToggle(newState);
  };

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const percentage = ((25 * 60 - time) / (25 * 60)) * 100;

  const handleLogSession = async () => {
    if (!subject.trim()) {
      setLogMessage('Add a subject before logging.');
      return;
    }
    setIsSaving(true);
    setLogMessage(null);
    try {
      const response = await apiFetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          minutes: 25,
        }),
      });
      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? 'Failed to log session');
      }
      setLogMessage('Session logged to server ✅');
      setSubject('');
    } catch (error) {
      setLogMessage(error instanceof Error ? error.message : 'Failed to log session');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/10 hover:border-sage-300 dark:hover:border-white/20 transition-all"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Zap size={20} className="text-sage-900 dark:text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-sage-900 dark:text-white">Focus Hub</h2>
            <p className="text-xs text-sage-500 dark:text-gray-400">Pomodoro Timer</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDeepWork}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            isDeepWork
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-sage-900 dark:text-white shadow-lg shadow-orange-500/30'
              : 'bg-white/10 text-sage-600 dark:text-gray-300 hover:bg-white/20'
          }`}
        >
          Deep Work
        </motion.button>
      </div>

      <div className="flex flex-col items-center justify-center py-8">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              stroke="url(#focusGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 88 * (1 - percentage / 100),
              }}
              strokeDasharray={2 * Math.PI * 88}
              transition={{ duration: 0.5 }}
            />
            <defs>
              <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${minutes}-${seconds}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="text-5xl font-bold text-sage-900 dark:text-white tabular-nums"
              >
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsRunning(!isRunning)}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-sage-900 dark:text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow"
          >
            {isRunning ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              setTime(25 * 60);
              setIsRunning(false);
            }}
            className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-sage-600 dark:text-gray-300 hover:bg-white/20 transition-colors"
          >
            <RotateCcw size={20} />
          </motion.button>
        </div>

        <div className="mt-6 flex flex-col gap-3 w-full max-w-md">
          <div className="px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-medium text-center">
            Sessions Completed: {sessionCount}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 rounded-xl bg-white text-sage-900 placeholder:text-sage-500 border border-gray-200 dark:bg-black/40 dark:text-white dark:placeholder:text-gray-400 dark:border-white/10 px-3 py-2 outline-none focus:border-sage-300 dark:focus:border-white/20 text-sm"
              placeholder="What did you focus on? (e.g. DSA, Physics)"
            />
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleLogSession}
              disabled={isSaving}
              className="rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : 'Log 25m'}
            </motion.button>
          </div>

          {logMessage && (
            <p className="text-xs text-center text-sage-600 dark:text-gray-300 bg-white/5 rounded-xl px-3 py-2">
              {logMessage}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
