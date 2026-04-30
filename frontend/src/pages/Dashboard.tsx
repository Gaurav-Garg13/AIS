// Deployment trigger: Vercel + Atlas Migration
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { Play, Pause, RotateCcw, Plus, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { apiFetch } from '../utils/api';
import StudyAssistantBot from '../components/StudyAssistantBot';
import QuickNotes from '../components/QuickNotes';

interface DashboardProps {
  onDeepWorkToggle: (active: boolean) => void;
}

type Course = {
  id: string;
  code: string;
  title: string;
  progress: number;
  credits: number;
};

type AttendanceEntry = {
  subjectId: string;
  status: 'present' | 'absent' | 'late' | 'unmarked';
  date?: string;
};

type Assignment = {
  id: string;
  title: string;
  course: string;
  due: string;
  status: string;
  priority?: string;
};


export default function Dashboard({ onDeepWorkToggle }: DashboardProps) {
  const { profile } = useAppContext();

  // --- Real Data State ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Attendance Date ---
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // --- Pomodoro State ---
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [focusSessionText, setFocusSessionText] = useState("");

  // --- Deadline Form State ---
  const [deadlineTitle, setDeadlineTitle] = useState("");
  const [deadlineSubject, setDeadlineSubject] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [deadlinePriority, setDeadlinePriority] = useState("Medium");
  const [isAddingDeadline, setIsAddingDeadline] = useState(false);

  // --- Live Clock State ---
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // --- Quote of the Day ---
  const quotes = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The beautiful thing about learning is nobody can take it from you.", author: "B.B. King" },
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "Education is the passport to the future.", author: "Malcolm X" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  ];
  const todayIndex = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)) % quotes.length;
  const todayQuote = quotes[todayIndex];

  // --- Today's Goals (multi-goal) ---
  type Goal = { id: string; text: string; done: boolean };
  const [goals, setGoals] = useState<Goal[]>(() => {
    try { return JSON.parse(localStorage.getItem('dashboard_goals') || '[]'); } catch { return []; }
  });
  const [newGoalText, setNewGoalText] = useState('');
  const goalInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    localStorage.setItem('dashboard_goals', JSON.stringify(goals));
  }, [goals]);

  const addGoal = () => {
    const text = newGoalText.trim();
    if (!text) return;
    setGoals(prev => [...prev, { id: Date.now().toString(), text, done: false }]);
    setNewGoalText('');
    goalInputRef.current?.focus();
  };

  const toggleGoal = (id: string) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  const removeGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      onDeepWorkToggle(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onDeepWorkToggle]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
    if (!isRunning) onDeepWorkToggle(true);
    else onDeepWorkToggle(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(25 * 60);
    onDeepWorkToggle(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, attRes, assignRes] = await Promise.all([
          apiFetch('/api/courses'),
          apiFetch('/api/attendance').catch(() => ({ ok: true, json: () => [] })),
          apiFetch('/api/assignments')
        ]);

        if (coursesRes.ok) setCourses(await coursesRes.json());
        if (attRes.ok) setAttendanceEntries(await attRes.json());
        if (assignRes.ok) setAssignments(await assignRes.json());
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  // --- Heatmap Logic ---
  const weeks = 12;
  const days = 7;
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 14); // Include 2 weeks of the future

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - (weeks * days - 1));

  const heatmapDays = Array.from({ length: weeks * days }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayAssignments = assignments.filter(a => a.due.split('T')[0] === dateStr);
    return {
      date: dateStr,
      assignments: dayAssignments
    };
  });

  const getHeatmapColor = (dayAssignments: Assignment[]) => {
    if (dayAssignments.length === 0) return 'bg-slate-100 dark:bg-slate-800/50';

    // Determine color by highest priority assignment in that day
    const priorities = dayAssignments.map(a => (a.priority || 'Medium').toLowerCase());
    if (priorities.includes('high')) return 'bg-[#8C4A4A]'; // Red - Most Important
    if (priorities.includes('medium')) return 'bg-[#B89B72]'; // Brass - Important
    return 'bg-[#4E7F65]'; // Sage - Normal
  };

  const handleAddDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deadlineTitle || !deadlineDate) return;
    setIsAddingDeadline(true);

    try {
      const res = await apiFetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: deadlineTitle,
          course: deadlineSubject || "General",
          due: deadlineDate,
          priority: deadlinePriority,
          status: 'todo'
        }),
      });
      if (res.ok) {
        const newAssignment = await res.json();
        setAssignments(prev => [...prev, newAssignment]);
        setDeadlineTitle("");
        setDeadlineSubject("");
        setDeadlineDate("");
        setDeadlinePriority("Medium");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingDeadline(false);
    }
  };

  const markAttendance = async (courseId: string, courseName: string, status: 'present' | 'absent') => {
    // Replace existing entry for same subject+date (no duplicates)
    setAttendanceEntries(prev => {
      const filtered = prev.filter(e => !(e.subjectId === courseId && e.date === attendanceDate));
      return [...filtered, { subjectId: courseId, status, date: attendanceDate }];
    });

    try {
      await apiFetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId: courseId,
          subjectName: courseName,
          date: attendanceDate,
          status,
        })
      });
    } catch (err) {
      console.error("Failed to mark attendance", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white dark:bg-[#1A1817]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Sort upcoming deadlines (nearest first)
  const upcomingDeadlines = assignments
    .filter(a => a.status !== 'done')
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime());

  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-[#1A1817] transition-colors duration-300 relative">
      {/* Background Dot Pattern */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 dark:hidden" style={{ backgroundImage: "radial-gradient(#e5e7eb 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
        <div className="absolute inset-0 hidden dark:block" style={{ backgroundImage: "radial-gradient(#2C2A28 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
      </div>

      {/* Center Column (Scrollable Workspace) */}
      <div className="flex-1 overflow-y-auto px-10 py-12 hide-scrollbar relative z-10">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Header Section */}
          <section>
            <h1 className={`text-5xl tracking-tight mb-8 section-title`}>
              Welcome back, {profile?.name?.split(' ')[0] || 'Student'}.
            </h1>

            {/* Top 4-Card Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Card 1 — Mini Calendar */}
              <div className="bg-white dark:bg-[#242220] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden min-h-[160px] flex flex-col">
                {/* Calendar header */}
                <div className="bg-[#2d4f47] px-4 py-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/70 font-sans">
                    {now.toLocaleDateString('en-US', { month: 'long' })}
                  </span>
                  <span className="text-xs font-semibold text-white/70 font-sans">{now.getFullYear()}</span>
                </div>
                {/* Day names */}
                <div className="grid grid-cols-7 px-3 pt-2 pb-1">
                  {['S','M','T','W','T','F','S'].map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-bold uppercase tracking-wide text-slate-400">{d}</div>
                  ))}
                </div>
                {/* Days grid */}
                <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5 flex-1">
                  {(() => {
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const firstDay = new Date(year, month, 1).getDay();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const today = now.getDate();
                    const cells = [];
                    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
                    for (let d = 1; d <= daysInMonth; d++) {
                      const isToday = d === today;
                      cells.push(
                        <div key={d} className={`text-center text-[10px] font-medium rounded-full w-5 h-5 mx-auto flex items-center justify-center transition-colors ${
                          isToday ? 'bg-[#2d4f47] text-white font-bold' : 'text-slate-600 dark:text-slate-300'
                        }`}>
                          {d}
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
                <div className="px-4 pb-2">
                  <p className="text-[10px] text-slate-400 font-sans">{now.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                </div>
              </div>

              {/* Card 2 — Live Clock */}
              <div className="bg-white dark:bg-[#242220] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[160px]">
                <p className="text-xs uppercase tracking-widest font-sans text-slate-500 self-start mb-1">Current Time</p>
                <div className="text-center mt-2">
                  <p className="text-3xl font-bold font-mono text-slate-800 dark:text-slate-100 tracking-tight tabular-nums">
                    {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 font-sans">
                    {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </p>
                </div>
              </div>

              {/* Card 3 — Quote of the Day */}
              <div className="bg-white dark:bg-[#242220] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col justify-between min-h-[160px]">
                <p className="text-xs uppercase tracking-widest font-sans text-slate-500">Quote of the Day</p>
                <div className="mt-3 flex-1">
                  <p className="font-serif text-slate-800 dark:text-slate-100 text-sm leading-snug">
                    "{todayQuote.text}"
                  </p>
                  <p className="text-xs text-[#8aaca5] mt-2 italic font-serif">— {todayQuote.author}</p>
                </div>
                <div className="border-b border-[#B89B72]/40 w-1/3 mt-3" />
              </div>

              {/* Card 4 — Today's Goals (multi-goal) */}
              <div className="bg-white dark:bg-[#242220] border border-slate-200 dark:border-white/10 rounded-2xl p-5 flex flex-col min-h-[160px]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs uppercase tracking-widest font-sans text-slate-500">Today's Goals</p>
                  {goals.length > 0 && (
                    <span className="text-[10px] font-semibold font-sans text-[#4E7F65]">
                      {goals.filter(g => g.done).length}/{goals.length}
                    </span>
                  )}
                </div>

                {/* Goal list */}
                <div className="flex-1 overflow-y-auto space-y-1.5 hide-scrollbar max-h-[90px] pr-0.5">
                  {goals.length === 0 && (
                    <p className="text-xs italic text-slate-400 font-serif">No goals yet — add one below.</p>
                  )}
                  {goals.map(goal => (
                    <div key={goal.id} className="flex items-center gap-2 group">
                      <button
                        onClick={() => toggleGoal(goal.id)}
                        className="flex-shrink-0 text-[#8aaca5] hover:text-[#4E7F65] transition-colors"
                      >
                        {goal.done ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                      </button>
                      <p className={`flex-1 font-serif text-xs leading-snug transition-all ${
                        goal.done ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                      }`}>
                        {goal.text}
                      </p>
                      <button
                        onClick={() => removeGoal(goal.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-[#8C4A4A] text-xs leading-none flex-shrink-0"
                        title="Remove goal"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add goal input */}
                <form
                  onSubmit={e => { e.preventDefault(); addGoal(); }}
                  className="flex items-center gap-2 mt-3 border-t border-slate-100 dark:border-white/10 pt-3"
                >
                  <input
                    ref={goalInputRef}
                    type="text"
                    placeholder="Add a goal..."
                    value={newGoalText}
                    onChange={e => setNewGoalText(e.target.value)}
                    className="flex-1 bg-transparent font-serif text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newGoalText.trim()}
                    className="flex-shrink-0 text-[#8aaca5] hover:text-[#4E7F65] transition-colors disabled:opacity-30"
                  >
                    <Plus size={16} />
                  </button>
                </form>
              </div>

            </div>
          </section>


          {/* Manual Attendance Tracker */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl section-title`}>Attendance Tracker</h2>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className={`bg-transparent border-b border-slate-300 dark:border-slate-700 outline-none pb-1 font-sans text-sm text-slate-800 dark:text-slate-200 focus:border-[#4E7F65] transition-colors`}
              />
            </div>

            {courses.length === 0 ? (
              <div className={`card-editorial flex flex-col items-center justify-center py-12`}>
                <p className={`text-sm italic text-muted`}>You are not enrolled in any courses yet.</p>
              </div>
            ) : (
              <div className={`card-editorial max-h-[400px] overflow-y-auto scrollbar-thin`}>
                <div className="flex flex-col">
                  {courses.map((course) => {
                    const courseId = (course as any)._id || course.id || course.code;
                    const cEntries = attendanceEntries.filter(e => e.subjectId === courseId && e.status !== 'unmarked');
                    const total = cEntries.length;
                    const attended = cEntries.filter(e => e.status === 'present' || e.status === 'late').length;
                    const percentage = total === 0 ? 0 : Math.round((attended / total) * 100);

                    return (
                      <div key={courseId} className="grid grid-cols-4 gap-4 items-center py-4 border-b border-slate-200 dark:border-white/10 last:border-0">
                        {/* Column 1: Name */}
                        <div className="font-serif font-bold text-slate-800 dark:text-slate-100 truncate pr-2">
                          {course.title || course.code}
                        </div>
                        
                        {/* Column 2: Progress bar */}
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden flex-1">
                            <div className="bg-[#4E7F65] h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className={`text-sm font-semibold text-muted min-w-[40px] text-right`}>{percentage}%</span>
                        </div>

                        {/* Column 3: Ratio */}
                        <div className={`text-xs uppercase tracking-widest font-semibold text-center text-muted`}>
                          {attended} / {total}
                        </div>

                        {/* Column 4: Actions */}
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => markAttendance(courseId, course.title || course.code, 'present')}
                            className="bg-[#4E7F65] text-white rounded-md px-3 py-1.5 text-[10px] uppercase tracking-wider font-sans font-medium hover:opacity-90 transition-opacity"
                          >
                            Present
                          </button>
                          <button
                            onClick={() => markAttendance(courseId, course.title || course.code, 'absent')}
                            className="bg-[#8C4A4A] text-white rounded-md px-3 py-1.5 text-[10px] uppercase tracking-wider font-sans font-medium hover:opacity-90 transition-opacity"
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>


          {/* Activity & Deadlines */}
          <section>
            <h2 className={`text-2xl mb-6 section-title`}>Activity & Deadlines</h2>
            <div className={`card-editorial grid grid-cols-1 md:grid-cols-2 gap-12`}>

              {/* Left Column: Form + Heatmap */}
              <div className="space-y-10">
                {/* Add Deadline Form */}
                <form onSubmit={handleAddDeadline} className="space-y-4">
                  <div>
                    <label className={`block text-xs uppercase tracking-widest font-semibold mb-1 text-muted`}>Assignment/Exam Title</label>
                    <input
                      type="text"
                      required
                      value={deadlineTitle}
                      onChange={(e) => setDeadlineTitle(e.target.value)}
                      placeholder="e.g. Midterm Essay"
                      className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 py-2 outline-none focus:border-[#B89B72] dark:focus:border-[#B89B72] transition-colors font-sans text-sm"
                    />
                  </div>
                  <div>
                    <label className={`block text-xs uppercase tracking-widest font-semibold mb-1 text-muted`}>Subject</label>
                    <input
                      type="text"
                      value={deadlineSubject}
                      onChange={(e) => setDeadlineSubject(e.target.value)}
                      placeholder="e.g. Core Module A"
                      className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 py-2 outline-none focus:border-[#B89B72] dark:focus:border-[#B89B72] transition-colors font-sans text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-xs uppercase tracking-widest font-semibold mb-1 text-muted`}>Date</label>
                      <input
                        type="date"
                        required
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 py-2 outline-none focus:border-[#B89B72] dark:focus:border-[#B89B72] transition-colors font-sans text-sm"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs uppercase tracking-widest font-semibold mb-1 text-muted`}>Priority</label>
                      <select
                        value={deadlinePriority}
                        onChange={(e) => setDeadlinePriority(e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 py-2 outline-none focus:border-[#B89B72] dark:focus:border-[#B89B72] transition-colors font-sans text-sm"
                      >
                        <option value="High" className="dark:bg-[#242220]">High</option>
                        <option value="Medium" className="dark:bg-[#242220]">Medium</option>
                        <option value="Low" className="dark:bg-[#242220]">Low</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isAddingDeadline}
                      className="px-6 py-2 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-md text-sm font-medium hover:opacity-90 transition-opacity font-sans flex items-center justify-center gap-2 w-full shadow-sm"
                    >
                      {isAddingDeadline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                      {isAddingDeadline ? "Adding..." : "Add Deadline"}
                    </button>
                  </div>
                </form>

                {/* 12-Week Heatmap */}
                <div>
                  <h3 className={`text-sm font-semibold uppercase tracking-widest mb-4 text-muted`}>12-Week Activity</h3>
                  <div className="grid grid-cols-12 gap-1.5 w-max">
                    {Array.from({ length: weeks }).map((_, weekIdx) => (
                      <div key={weekIdx} className="space-y-1.5">
                        {Array.from({ length: days }).map((_, dayIdx) => {
                          const dayData = heatmapDays[weekIdx * days + dayIdx];
                          const hasAssignments = dayData.assignments.length > 0;
                          let tooltipText = dayData.date;
                          if (hasAssignments) {
                            tooltipText = dayData.assignments.map(a => `${a.course || 'General'} - ${a.title} (${new Date(a.due).toLocaleDateString()})`).join('\n');
                          }

                          const isToday = dayData.date === today.toISOString().split('T')[0];

                          return (
                            <div
                              key={`${weekIdx}-${dayIdx}`}
                              className={`w-3.5 h-3.5 rounded-[2px] transition-all duration-300 ${getHeatmapColor(dayData.assignments)} ${isToday ? 'ring-2 ring-slate-400 dark:ring-slate-500 ring-offset-2 dark:ring-offset-[#242220] scale-110 z-10' : ''}`}
                              title={tooltipText}
                            ></div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Upcoming Deadlines */}
              <div className="flex flex-col h-full border-l border-slate-100 dark:border-white/5 pl-8">
                <h3 className={`text-sm font-semibold uppercase tracking-widest mb-6 text-muted`}>Upcoming</h3>
                <div className="space-y-4 overflow-y-auto flex-1 pr-2 hide-scrollbar">
                  {upcomingDeadlines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-60">
                      <p className={`text-sm italic text-center text-muted`}>No upcoming deadlines.<br />You're all caught up!</p>
                    </div>
                  ) : (
                    upcomingDeadlines.map(deadline => {
                      // Determine border & bg based on priority or default
                      let borderClass = "border-[#4E7F65]";
                      let bgClass = "bg-[#4E7F65]/5 dark:bg-[#4E7F65]/10";

                      const p = deadline.priority?.toLowerCase() || 'medium';
                      if (p === 'high') {
                        borderClass = "border-[#8C4A4A]";
                        bgClass = "bg-[#8C4A4A]/5 dark:bg-[#8C4A4A]/10";
                      } else if (p === 'medium') {
                        borderClass = "border-[#B89B72]";
                        bgClass = "bg-[#B89B72]/5 dark:bg-[#B89B72]/10";
                      }

                      return (
                        <div key={deadline.id} className={`flex flex-col p-4 rounded-r-xl border-l-4 ${borderClass} ${bgClass} transition-colors duration-300`}>
                          <p className={`text-sm font-medium section-title mb-1 leading-tight`}>{deadline.title}</p>
                          <p className={`text-xs text-muted`}>
                            {deadline.course || 'General'} • {new Date(deadline.due).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </section>

          {/* Spacer for bottom */}
          <div className="h-8"></div>
        </div>
      </div>

      {/* Right Column (Fixed Sticky Sidebar - Focus Hub) */}
      <div className="w-96 border-l border-slate-200/60 dark:border-white/10 bg-[#F8FAFC] dark:bg-[#1A1817] flex flex-col h-full overflow-y-auto hide-scrollbar shrink-0 transition-colors duration-300 relative z-20">
        <div className="p-8 space-y-8">

          {/* Focus Hub */}
          <div className="bg-white dark:bg-[#242220] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm text-center relative overflow-hidden group transition-colors duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-[#1A1817]">
              <div
                className="h-full bg-[#B89B72] transition-all duration-1000 ease-linear"
                style={{ width: `${((25 * 60 - timeLeft) / (25 * 60)) * 100}%` }}
              ></div>
            </div>
            <h2 className={`text-xl mb-6 mt-2 section-title`}>Focus Hub</h2>
            <h3 className={`text-7xl font-serif mb-8 tracking-tighter section-title`}>
              {formatTime(timeLeft)}
            </h3>

            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={toggleTimer}
                className="w-14 h-14 rounded-full bg-[#B89B72] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
              >
                {isRunning ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
              </button>
              <button
                onClick={resetTimer}
                className="w-14 h-14 rounded-full bg-slate-100 dark:bg-[#1A1817] border border-slate-200 dark:border-white/10 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-[#B89B72]"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            {/* Session Logging Input */}
            <div className="text-left">
              <label className={`block text-xs uppercase tracking-widest font-semibold mb-2 text-muted`}>Session Log</label>
              <input
                type="text"
                value={focusSessionText}
                onChange={(e) => setFocusSessionText(e.target.value)}
                placeholder="What did you focus on?"
                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 py-2 outline-none focus:border-[#B89B72] dark:focus:border-[#B89B72] transition-colors font-sans text-sm"
              />
            </div>
          </div>

          {/* Study Assistant Bot */}
          <StudyAssistantBot />

          {/* Quick Notes */}
          <QuickNotes />

        </div>
      </div>

    </div>
  );
}
