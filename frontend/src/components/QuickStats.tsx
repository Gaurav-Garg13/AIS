import { apiFetch } from '../utils/api';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Trophy, Flame, Clock, TrendingUp, Zap, Award, Activity } from 'lucide-react';

const iconMap = {
  Target,
  Trophy,
  Flame,
  Clock,
  TrendingUp,
  Zap,
  Award,
  Activity,
} as const;

type IconKey = keyof typeof iconMap;

type Stat = {
  icon: IconKey;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  change: string;
};

type AttendanceEntry = {
  date: string; // YYYY-MM-DD
  status: 'present' | 'absent' | 'late';
  markedAt: string;
};

type SessionEntry = {
  id?: number | string;
  subject: string;
  minutes: number;
  createdAt: string;
};

type DeadlineEntry = {
  id?: number | string;
  title: string;
  subject: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  createdAt?: string;
};

const fallbackStats: Stat[] = [
  {
    icon: 'Target',
    label: 'Current Streak',
    value: '12 days',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500/10',
    change: '+2 this week',
  },
  {
    icon: 'Trophy',
    label: 'Total Points',
    value: '2,450',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/10',
    change: '+180 this week',
  },
  {
    icon: 'Flame',
    label: 'Study Hours',
    value: '24.5h',
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-500/10',
    change: '+3.2h this week',
  },
  {
    icon: 'Clock',
    label: 'Avg Session',
    value: '45 min',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    change: '+5 min',
  },
];

const clampToStartOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const formatSigned = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

const formatHours = (minutes: number) => `${(minutes / 60).toFixed(1)}h`;

const formatMinutes = (minutes: number) => `${Math.round(minutes)} min`;

const formatNumber = (n: number) => n.toLocaleString('en-US');

const dateKey = (d: Date) => d.toISOString().slice(0, 10);

const parseDateKey = (key: string) => new Date(`${key}T00:00:00`);

function computeStreak(attendance: AttendanceEntry[], endKey: string) {
  const active = new Set(
    attendance
      .filter((e) => e.status === 'present' || e.status === 'late')
      .map((e) => e.date)
  );

  if (!active.has(endKey)) return 0;

  let streak = 0;
  let cursor = parseDateKey(endKey);
  while (active.has(dateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function sumSessionMinutesInRange(sessions: SessionEntry[], start: Date, endExclusive: Date) {
  const startMs = start.getTime();
  const endMs = endExclusive.getTime();
  return sessions.reduce((acc, s) => {
    const t = new Date(s.createdAt).getTime();
    if (Number.isNaN(t)) return acc;
    if (t >= startMs && t < endMs) return acc + (Number(s.minutes) || 0);
    return acc;
  }, 0);
}

function avgSessionMinutesInRange(sessions: SessionEntry[], start: Date, endExclusive: Date) {
  const startMs = start.getTime();
  const endMs = endExclusive.getTime();
  let sum = 0;
  let count = 0;
  for (const s of sessions) {
    const t = new Date(s.createdAt).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= startMs && t < endMs) {
      sum += Number(s.minutes) || 0;
      count += 1;
    }
  }
  return count === 0 ? 0 : sum / count;
}

function pointsForAttendance(e: AttendanceEntry) {
  if (e.status === 'present') return 10;
  if (e.status === 'late') return 5;
  return 0;
}

function pointsForSession(s: SessionEntry) {
  const minutes = Number(s.minutes) || 0;
  return minutes / 5;
}

function pointsForDeadline(d: DeadlineEntry) {
  // Reward planning ahead: bigger reward if created >=24h before due date.
  const dueMs = new Date(d.dueDate).getTime();
  const createdMs = d.createdAt ? new Date(d.createdAt).getTime() : Number.NaN;
  if (Number.isNaN(dueMs) || Number.isNaN(createdMs)) return 0;
  if (createdMs < dueMs - 24 * 60 * 60 * 1000) return 20;
  if (createdMs < dueMs) return 5;
  return 0;
}

function sumPointsInRange(
  attendance: AttendanceEntry[],
  sessions: SessionEntry[],
  deadlines: DeadlineEntry[],
  start: Date,
  endExclusive: Date
) {
  const startMs = start.getTime();
  const endMs = endExclusive.getTime();

  const attendancePoints = attendance.reduce((acc, e) => {
    const t = parseDateKey(e.date).getTime();
    if (t >= startMs && t < endMs) return acc + pointsForAttendance(e);
    return acc;
  }, 0);

  const sessionPoints = sessions.reduce((acc, s) => {
    const t = new Date(s.createdAt).getTime();
    if (Number.isNaN(t)) return acc;
    if (t >= startMs && t < endMs) return acc + pointsForSession(s);
    return acc;
  }, 0);

  const deadlinePoints = deadlines.reduce((acc, d) => {
    const t = d.createdAt ? new Date(d.createdAt).getTime() : Number.NaN;
    if (Number.isNaN(t)) return acc;
    if (t >= startMs && t < endMs) return acc + pointsForDeadline(d);
    return acc;
  }, 0);

  return attendancePoints + sessionPoints + deadlinePoints;
}

export default function QuickStats() {
  const [stats, setStats] = useState<Stat[]>(fallbackStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAndComputeStats = async () => {
      try {
        const [attendanceRes, sessionsRes, deadlinesRes] = await Promise.all([
          apiFetch('/api/attendance'),
          apiFetch('/api/sessions'),
          apiFetch('/api/deadlines'),
        ]);

        if (!attendanceRes.ok || !sessionsRes.ok || !deadlinesRes.ok) {
          throw new Error('Failed to fetch live stats inputs');
        }

        const [attendance, sessions, deadlines] = (await Promise.all([
          attendanceRes.json(),
          sessionsRes.json(),
          deadlinesRes.json(),
        ])) as [AttendanceEntry[], SessionEntry[], DeadlineEntry[]];

        const today = clampToStartOfDay(new Date());
        const todayKey = dateKey(today);

        // Streak
        const streakToday = computeStreak(attendance, todayKey);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const streakWeekAgo = computeStreak(attendance, dateKey(weekAgo));
        const streakDelta = streakToday - streakWeekAgo;

        // Points (all time + weekly delta)
        const totalPoints = Math.round(
          sumPointsInRange(attendance, sessions, deadlines, new Date(0), new Date('2999-01-01T00:00:00'))
        );

        const last7Start = new Date(today);
        last7Start.setDate(last7Start.getDate() - 6); // inclusive 7-day window: today..6 days back
        const nextDay = new Date(today);
        nextDay.setDate(nextDay.getDate() + 1);

        const prev7Start = new Date(last7Start);
        prev7Start.setDate(prev7Start.getDate() - 7);

        const last7Points = Math.round(sumPointsInRange(attendance, sessions, deadlines, last7Start, nextDay));
        const prev7Points = Math.round(sumPointsInRange(attendance, sessions, deadlines, prev7Start, last7Start));
        const pointsDelta = last7Points - prev7Points;

        // Study hours (last 7 days + delta vs previous 7)
        const last7Minutes = sumSessionMinutesInRange(sessions, last7Start, nextDay);
        const prev7Minutes = sumSessionMinutesInRange(sessions, prev7Start, last7Start);
        const hoursDelta = (last7Minutes - prev7Minutes) / 60;

        // Avg session (last 30 days + delta vs previous 30)
        const last30Start = new Date(today);
        last30Start.setDate(last30Start.getDate() - 29);
        const prev30Start = new Date(last30Start);
        prev30Start.setDate(prev30Start.getDate() - 30);

        const last30Avg = avgSessionMinutesInRange(sessions, last30Start, nextDay);
        const prev30Avg = avgSessionMinutesInRange(sessions, prev30Start, last30Start);
        const avgDelta = last30Avg - prev30Avg;

        const computed: Stat[] = [
          {
            icon: 'Target',
            label: 'Current Streak',
            value: `${Math.max(0, streakToday)} days`,
            color: 'from-orange-500 to-red-500',
            bgColor: 'bg-orange-500/10',
            change: streakDelta > 0 ? `+${streakDelta} this week` : streakDelta < 0 ? `${streakDelta} this week` : 'Maintained',
          },
          {
            icon: 'Trophy',
            label: 'Total Points',
            value: formatNumber(totalPoints),
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'bg-yellow-500/10',
            change: pointsDelta > 0 ? `+${pointsDelta} this week` : pointsDelta < 0 ? `${pointsDelta} this week` : 'Stable',
          },
          {
            icon: 'Flame',
            label: 'Study Hours',
            value: formatHours(Math.max(0, last7Minutes)),
            color: 'from-red-500 to-pink-500',
            bgColor: 'bg-red-500/10',
            change: hoursDelta > 0 ? `+${hoursDelta.toFixed(1)}h this week` : hoursDelta < 0 ? `${hoursDelta.toFixed(1)}h this week` : 'Same as last week',
          },
          {
            icon: 'Clock',
            label: 'Avg Session',
            value: formatMinutes(Math.max(0, last30Avg)),
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-500/10',
            change: avgDelta > 0 ? `+${Math.round(avgDelta)} min` : avgDelta < 0 ? `${Math.round(avgDelta)} min` : 'Consistent',
          },
        ];

        // Keep ordering stable with fallbackStats
        setStats(computed);
      } catch (error) {
        // If the server is not running or request fails, we silently use fallbackStats.
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndComputeStats();
  }, []);

  return (
    <div className="relative">
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ 
              duration: 0.6, 
              delay: index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { duration: 0.2 }
            }}
            className="group relative"
          >
            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-all duration-500"
              style={{
                backgroundImage: `linear-gradient(to right, ${stat.color.split(' ')[0]}, ${stat.color.split(' ')[2] || stat.color.split(' ')[1]})`
              }}
            ></div>
            
            <div className={`relative ${stat.bgColor} backdrop-blur-2xl rounded-2xl p-6 border border-gray-200 dark:border-white/10 hover:border-sage-300 dark:hover:border-white/20 transition-all duration-300 overflow-hidden bg-white dark:border-white/10 dark:hover:border-white/20 dark:bg-transparent`}>
              {index >= 2 && (
                <div
                  className={`absolute inset-0 rounded-2xl ${stat.bgColor} dark:hidden pointer-events-none`}
                />
              )}
              {/* Icon container */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-all duration-300 relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-white/20 transform scale-0 group-hover:scale-100 transition-transform duration-300 rounded-xl"></div>
                  {(() => {
                    const IconComponent = iconMap[stat.icon] ?? Target;
                    return <IconComponent size={28} className="text-white relative z-10" />;
                  })()}
                </div>
                
                {/* Trend indicator */}
                <div className="flex items-center gap-1">
                  <TrendingUp size={16} className="text-green-400" />
                  <span className="text-xs text-green-400 font-medium">Live</span>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-3xl font-bold text-sage-900 dark:text-white mb-1">
                    {isLoading ? (
                      <div className="inline-block">
                        Loading...
                      </div>
                    ) : (
                      <span>
                        {stat.value}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-sage-600 dark:text-gray-300">{stat.label}</div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Activity size={12} className="text-green-400" />
                    <span className="text-xs text-green-400 font-medium">{stat.change}</span>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/30 rounded-full"></div>
              <div className="absolute top-2 left-2 w-1 h-1 bg-white/30 rounded-full"></div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
