import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { attendanceData } from '../data/mockData';

function CircularProgress({ percentage, color, size = 120 }: { percentage: number; color: string; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

type AttendanceEntry = {
  date: string;
  status: 'present' | 'absent' | 'late';
  markedAt: string;
};

const getLocalDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`; // strict local YYYY-MM-DD
};

export default function AttendanceTracker() {
  const [todayStatus, setTodayStatus] = useState<AttendanceEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);

  useEffect(() => {
    const loadToday = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/attendance');
        if (!response.ok) return;
        const all = (await response.json()) as AttendanceEntry[];
        setAttendanceEntries(all);
        const todayKey = getLocalDateKey();
        const found = all.find((e) => e.date === todayKey) ?? null;
        setTodayStatus(found);
      } catch {
        // ignore – purely enhancement
      }
    };
    loadToday();
  }, []);

  const markToday = async (status: AttendanceEntry['status']) => {
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch('http://localhost:3000/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? 'Failed to mark attendance');
      }
      const entry = (await response.json()) as AttendanceEntry;
      setTodayStatus(entry);
      setAttendanceEntries((prev) => {
        const existingIndex = prev.findIndex((e) => e.date === entry.date);
        if (existingIndex === -1) {
          return [...prev, entry];
        }
        const updated = [...prev];
        updated[existingIndex] = entry;
        return updated;
      });
      setMessage('Saved for today ✔');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to mark attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateSafeMiss = (attended: number, total: number) => {
    const currentPercentage = (attended / total) * 100;
    if (currentPercentage < 75) return 0;
    const maxMissable = Math.floor((attended - 0.75 * total) / 0.75);
    return Math.max(0, maxMissable);
  };

  const totalLectures = attendanceEntries.length;
  const attendedLectures = attendanceEntries.filter((e) => e.status === 'present' || e.status === 'late').length;
  const overallPercentage =
    totalLectures === 0 ? 0 : (attendedLectures / totalLectures) * 100;
  const overallSafeMiss = calculateSafeMiss(attendedLectures, totalLectures || 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Attendance Tracker</h2>
        <div className="flex flex-col items-end gap-1">
          <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
            All On Track
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            <span>Today:</span>
            <span className="font-semibold text-gray-200">
              {todayStatus ? todayStatus.status.toUpperCase() : 'Not marked'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {attendanceData.map((subject, index) => {
          const isLow = overallPercentage < 80;

          return (
            <motion.div
              key={subject.subject}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center"
            >
              <CircularProgress percentage={overallPercentage} color={subject.color} />
              <h3 className="mt-4 font-semibold text-white text-sm text-center">{subject.subject}</h3>
              <p className="text-xs text-gray-400 mt-1">
                {attendedLectures}/{totalLectures || 0} classes
              </p>
              <div
                className={`mt-2 px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                  isLow ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {isLow && <AlertCircle size={12} />}
                <span>Safe-Miss: {overallSafeMiss}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-xs text-gray-400">
          Mark your attendance for today. This is stored in <span className="text-gray-200">data/attendance.json</span>.
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => markToday('present')}
            disabled={isSaving}
            className="rounded-full bg-green-500/20 text-green-300 text-xs font-semibold px-3 py-1 border border-green-500/40 disabled:opacity-60"
          >
            Present
          </button>
          <button
            type="button"
            onClick={() => markToday('absent')}
            disabled={isSaving}
            className="rounded-full bg-red-500/20 text-red-300 text-xs font-semibold px-3 py-1 border border-red-500/40 disabled:opacity-60"
          >
            Absent
          </button>
          <button
            type="button"
            onClick={() => markToday('late')}
            disabled={isSaving}
            className="rounded-full bg-yellow-500/20 text-yellow-200 text-xs font-semibold px-3 py-1 border border-yellow-500/40 disabled:opacity-60"
          >
            Late
          </button>
        </div>
      </div>

      {message && (
        <p className="mt-3 text-xs text-gray-300 bg-white/5 rounded-xl px-3 py-2 text-center">
          {message}
        </p>
      )}
    </motion.div>
  );
}
