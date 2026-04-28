import { apiFetch } from '../utils/api';
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertTriangle } from 'lucide-react';

type DeadlinePriority = 'low' | 'medium' | 'high';

interface Deadline {
  id?: string | number;
  title: string;
  subject: string;
  dueDate: string;
  priority: DeadlinePriority;
}

export default function DeadlineHeatmap() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<DeadlinePriority>('medium');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(false);
  const [deadlinesError, setDeadlinesError] = useState<string | null>(null);

  const sortDeadlines = (items: Deadline[]) =>
    [...items].sort(
      (a, b) =>
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

  const fetchDeadlines = async () => {
    setIsLoadingDeadlines(true);
    setDeadlinesError(null);
    try {
      const response = await apiFetch('/api/deadlines');
      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? 'Failed to load deadlines');
      }
      const data = (await response.json()) as Deadline[];
      setDeadlines(sortDeadlines(data));
    } catch (error) {
      setDeadlinesError(error instanceof Error ? error.message : 'Failed to load deadlines');
    } finally {
      setIsLoadingDeadlines(false);
    }
  };

  useEffect(() => {
    void fetchDeadlines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddDeadline = async () => {
    if (!title.trim() || !subject.trim() || !dueDate) {
      setMessage('Fill in title, subject and due date.');
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await apiFetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          dueDate,
          priority,
        }),
      });
      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? 'Failed to save deadline');
      }
      // Try to use the created deadline if the API returns it,
      // otherwise fall back to reloading from the server.
      const created = (await response.json().catch(() => null)) as Deadline | null;
      if (created && created.title && created.dueDate) {
        setDeadlines((prev) => sortDeadlines([...prev, created]));
      } else {
        void fetchDeadlines();
      }
      setTitle('');
      setSubject('');
      setDueDate('');
      setPriority('medium');
      setMessage('Deadline saved to server ✔');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to save deadline');
    } finally {
      setIsSaving(false);
    }
  };

  const getHeatmapColor = (priority: string) => {
    if (priority === 'high') return 'bg-red-500';
    if (priority === 'medium') return 'bg-yellow-400';
    if (priority === 'low') return 'bg-green-500';
    return 'bg-gray-100 dark:bg-white/10';
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'high') return 'border-red-500 bg-red-500/10';
    if (priority === 'medium') return 'border-yellow-500 bg-yellow-500/10';
    return 'border-blue-500 bg-blue-500/10';
  };

  const getPriorityDot = (priority: string) => {
    if (priority === 'high') return 'bg-red-500';
    if (priority === 'medium') return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const weeks = 12;
  const days = 7;
  
  const heatmapData = useMemo(() => {
    const dataMap: Record<string, { count: number; priority: string }> = {};
    const priorityWeight: Record<string, number> = { high: 3, medium: 2, low: 1 };
    
    deadlines.forEach(d => {
      if (!d.dueDate) return;
      try {
        const dateStr = new Date(d.dueDate).toISOString().split('T')[0];
        if (!dataMap[dateStr]) {
          dataMap[dateStr] = { count: 0, priority: d.priority };
        }
        dataMap[dateStr].count += 1;
        if (priorityWeight[d.priority] > priorityWeight[dataMap[dateStr].priority]) {
          dataMap[dateStr].priority = d.priority;
        }
      } catch (e) {
        // ignore invalid dates
      }
    });

    const today = new Date();
    // Start 8 weeks ago to show past activity + 4 weeks of future deadlines
    const startDay = new Date(today);
    startDay.setDate(today.getDate() - (8 * 7));

    const daysArray = [];
    for (let i = 0; i < weeks * days; i++) {
      const currentDate = new Date(startDay);
      currentDate.setDate(startDay.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dataMap[dateStr];
      daysArray.push({
        date: dateStr,
        count: dayData?.count || 0,
        priority: dayData?.priority || 'none'
      });
    }
    return daysArray;
  }, [deadlines]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/10 hover:border-sage-300 dark:hover:border-white/20 transition-all"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
          <Calendar size={20} className="text-sage-900 dark:text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-sage-900 dark:text-white">Activity & Deadlines</h2>
          <p className="text-xs text-sage-500 dark:text-gray-400">12 weeks timeline (past & upcoming)</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 rounded-xl bg-white text-sage-900 placeholder:text-sage-500 border border-gray-200 dark:border-white/10 px-3 py-2 text-xs outline-none focus:border-sage-300 dark:bg-black/40 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-white/20"
              placeholder="Assignment / exam title"
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 rounded-xl bg-white text-sage-900 placeholder:text-sage-500 border border-gray-200 dark:border-white/10 px-3 py-2 text-xs outline-none focus:border-sage-300 dark:bg-black/40 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-white/20"
              placeholder="Subject"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl bg-white text-sage-900 border border-gray-200 dark:border-white/10 px-3 py-2 text-xs outline-none focus:border-sage-300 dark:bg-black/40 dark:text-white dark:focus:border-white/20"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="rounded-xl bg-white text-sage-900 border border-gray-200 dark:border-white/10 px-3 py-2 text-xs outline-none focus:border-sage-300 dark:bg-black/40 dark:text-white dark:focus:border-white/20"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddDeadline}
          disabled={isSaving}
          className="rounded-xl bg-white text-black px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Add deadline'}
        </button>
      </div>

      {message && (
        <p className="mb-4 text-xs text-sage-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2">
          {message}
        </p>
      )}

      <div className="mb-6">
        <div className="flex gap-1 mb-2">
          <div className="text-xs text-sage-500 dark:text-gray-400 w-8">Mon</div>
          <div className="flex-1 grid grid-cols-12 gap-1">
            {Array.from({ length: weeks }).map((_, weekIndex) => (
              <div key={weekIndex} className="grid grid-rows-7 gap-1">
                {Array.from({ length: days }).map((_, dayIndex) => {
                  const dataIndex = weekIndex * days + dayIndex;
                  const data = heatmapData[dataIndex];
                  return (
                    <motion.div
                      key={dayIndex}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: dataIndex * 0.002 }}
                      whileHover={{ scale: 1.5, zIndex: 10 }}
                      className={`w-3 h-3 rounded-sm ${getHeatmapColor(data.priority)} border border-gray-200 dark:border-white/10 cursor-pointer transition-all hover:ring-2 ring-white/50`}
                      title={`${data?.date}: ${data?.count || 0} tasks (${data.priority !== 'none' ? data.priority + ' priority' : 'no tasks'})`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-sage-500 dark:text-gray-400 mt-2">
          <span>Priority:</span>
          <div className="flex gap-3 items-center ml-1">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-500 border border-gray-200 dark:border-white/10" /> Low</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-yellow-400 border border-gray-200 dark:border-white/10" /> Med</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-500 border border-gray-200 dark:border-white/10" /> High</div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-sage-200 dark:border-white/10">
        <h3 className="text-sm font-semibold text-sage-900 dark:text-white mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-orange-400" />
          Upcoming Deadlines
        </h3>
        {deadlinesError && (
          <p className="text-xs text-red-400 mb-2">
            {deadlinesError}
          </p>
        )}
        <div className="space-y-2">
          {isLoadingDeadlines ? (
            <p className="text-xs text-sage-500 dark:text-gray-400">Loading deadlines...</p>
          ) : deadlines.length === 0 ? (
            <p className="text-xs text-sage-500 dark:text-gray-400">
              No upcoming deadlines yet. Add your first assignment above.
            </p>
          ) : (
            deadlines.map((deadline, index) => (
              <motion.div
                key={deadline.id ?? `${deadline.title}-${deadline.dueDate}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                whileHover={{ scale: 1.02, x: 4 }}
                className={`flex items-center justify-between p-3 rounded-lg border ${getPriorityColor(deadline.priority)} transition-all cursor-pointer`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getPriorityDot(deadline.priority)}`} />
                  <div>
                    <p className="text-sm font-medium text-sage-900 dark:text-white">{deadline.title}</p>
                    <p className="text-xs text-sage-500 dark:text-gray-400">{deadline.subject}</p>
                  </div>
                </div>
                <div className="text-xs text-sage-500 dark:text-gray-400">
                  {new Date(deadline.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
