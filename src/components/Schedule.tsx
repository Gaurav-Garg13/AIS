import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Plus, Trash2 } from 'lucide-react';

type ScheduleType = 'class' | 'study' | 'exam' | 'other';

type ScheduleEntry = {
  id: number | string;
  title: string;
  subject: string;
  dayOfWeek: number; // 0-6 (Mon-Sun)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  type: ScheduleType;
  location?: string;
};

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Schedule() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [type, setType] = useState<ScheduleType>('study');
  const [location, setLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('http://localhost:3000/api/schedule');
        if (!res.ok) {
          throw new Error('Failed to load schedule');
        }
        const data = (await res.json()) as ScheduleEntry[];
        setEntries(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load schedule');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchSchedule();
  }, []);

  const groupedByDay = useMemo(() => {
    const groups: Record<number, ScheduleEntry[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    for (const entry of entries) {
      const day = entry.dayOfWeek ?? 0;
      if (!groups[day]) groups[day] = [];
      groups[day].push(entry);
    }
    for (const day of Object.keys(groups)) {
      groups[Number(day)].sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return groups;
  }, [entries]);

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setDayOfWeek(0);
    setStartTime('09:00');
    setEndTime('10:00');
    setType('study');
    setLocation('');
  };

  const handleAdd = async () => {
    if (!title.trim() || !subject.trim()) {
      setFormMessage('Add a title and subject.');
      return;
    }
    setIsSaving(true);
    setFormMessage(null);
    try {
      const res = await fetch('http://localhost:3000/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          dayOfWeek,
          startTime,
          endTime,
          type,
          location: location.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? 'Failed to save schedule entry');
      }
      const created = (await res.json()) as ScheduleEntry;
      setEntries((prev) => [...prev, created]);
      resetForm();
      setFormMessage('Added to schedule ✔');
    } catch (e) {
      setFormMessage(e instanceof Error ? e.message : 'Failed to save schedule entry');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: ScheduleEntry['id']) => {
    const previous = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      const res = await fetch(`http://localhost:3000/api/schedule/${encodeURIComponent(String(id))}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) {
        throw new Error('Failed to delete');
      }
    } catch {
      // rollback
      setEntries(previous);
    }
  };

  const getBadgeColors = (entryType: ScheduleType) => {
    if (entryType === 'class') return 'bg-blue-500/15 text-blue-300 border-blue-500/40';
    if (entryType === 'exam') return 'bg-red-500/15 text-red-300 border-red-500/40';
    if (entryType === 'study') return 'bg-green-500/15 text-green-300 border-green-500/40';
    return 'bg-purple-500/15 text-purple-300 border-purple-500/40';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Weekly Schedule</h2>
            <p className="text-xs text-gray-400">Plan your classes and study blocks</p>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 lg:grid-cols-[2fr,3fr] gap-6">
        <div className="space-y-3">
          <p className="text-xs text-gray-400 mb-1">Add a new schedule block</p>
          <div className="flex flex-col gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl bg-black/40 text-white border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/20"
              placeholder="Title (e.g. DSA Lecture, DBMS revision)"
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl bg-black/40 text-white border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/20"
              placeholder="Subject"
            />
            <div className="flex gap-2">
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value) || 0)}
                className="rounded-xl bg-black/40 text-white border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/20 flex-1"
              >
                {dayLabels.map((label, index) => (
                  <option key={label} value={index}>
                    {label}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="rounded-xl bg-black/40 text-white border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/20 w-[6.5rem]"
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="rounded-xl bg-black/40 text-white border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/20 w-[6.5rem]"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ScheduleType)}
                className="rounded-xl bg-black/40 text-white border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/20 flex-1"
              >
                <option value="class">Class</option>
                <option value="study">Study</option>
                <option value="exam">Exam</option>
                <option value="other">Other</option>
              </select>
              <div className="flex-1 flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 rounded-xl bg-black/40 text-white border border-white/10 px-3 py-2 text-xs outline-none focus:border-white/20"
                  placeholder="Location (optional)"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-gray-400">
              Saved into <span className="text-gray-200">data/schedule.json</span> via backend.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={handleAdd}
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-xs font-semibold disabled:opacity-60"
            >
              <Plus size={14} />
              {isSaving ? 'Adding...' : 'Add to schedule'}
            </motion.button>
          </div>
          {formMessage && (
            <p className="text-[11px] text-gray-300 bg-white/5 rounded-xl px-3 py-2">{formMessage}</p>
          )}
        </div>

        <div className="rounded-2xl bg-black/40 border border-white/10 p-3">
          <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
            <Clock size={14} className="text-blue-400" />
            Overview of your week
          </p>
          <div className="grid grid-cols-7 gap-2 text-[11px] text-gray-300">
            {dayLabels.map((label, index) => (
              <div key={label} className="flex flex-col gap-1 min-h-[5rem]">
                <div className="sticky top-0 z-10 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-center border border-white/10">
                  {label}
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {groupedByDay[index]?.length === 0 && (
                    <div className="text-[10px] text-gray-500 px-1 py-2 text-center border border-dashed border-white/10 rounded-lg">
                      No blocks
                    </div>
                  )}
                  {groupedByDay[index]?.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -1, scale: 1.01 }}
                      className={`group rounded-lg border px-2 py-1 text-[11px] cursor-pointer ${getBadgeColors(
                        entry.type
                      )}`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-semibold truncate text-[11px]">{entry.title}</p>
                        <button
                          type="button"
                          onClick={() => handleDelete(entry.id)}
                          className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-300 transition-opacity"
                          aria-label="Delete"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-200 truncate">{entry.subject}</p>
                      <div className="flex items-center justify-between text-[10px] text-gray-300 mt-0.5">
                        <span>
                          {entry.startTime} - {entry.endTime}
                        </span>
                        {entry.location && <span className="truncate max-w-[4rem]">{entry.location}</span>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isLoading && <p className="text-xs text-gray-400">Loading schedule...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!isLoading && !error && entries.length === 0 && (
        <p className="text-xs text-gray-400">
          Your schedule is empty. Start by adding your fixed classes and then sprinkle in study blocks around them.
        </p>
      )}
    </motion.div>
  );
}

