import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Play, Pause, RotateCcw, Plus, Loader2 } from 'lucide-react';
import { apiFetch } from '../utils/api';

interface DashboardProps {
  onDeepWorkToggle: (active: boolean) => void;
}

type Course = {
  id: string;
  code: string;
  title: string;
  progress: number;
  credits: number;
  points: number;
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
  points: number;
  priority?: string;
};

const cardClass = "bg-[#F8FAFC] dark:bg-[#242220] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm transition-colors duration-300";
const serifTitle = "font-serif text-slate-900 dark:text-slate-100 transition-colors duration-300";
const sansText = "font-sans text-slate-600 dark:text-slate-400 transition-colors duration-300";

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

  // --- Stats Calculations ---
  const totalPoints = courses.reduce((sum, c) => sum + (c.points || 0), 0);
  const totalStudyHours = 32.5; // Mock logic
  const currentStreak = 14; // Mock logic
  const avgSession = 45; // Mock logic

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
          points: 10,
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
            <h1 className={`text-5xl tracking-tight mb-8 ${serifTitle}`}>
              Welcome back, {profile?.name?.split(' ')[0] || 'Student'}.
            </h1>

            {/* Top Atmospheric Foyer Row (4 Cards) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Card 1 — The Archive */}
              <div className="bg-white dark:bg-[#242220] border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <p className="text-xs uppercase tracking-widest font-sans text-slate-500">Daily Ephemera</p>
                <div className="mt-4">
                  <p className="font-serif text-slate-800 dark:text-slate-100 text-xl lg:text-2xl leading-snug mt-2">"The obstacle is the way."</p>
                  <p className="text-sm text-slate-500 mt-2 italic font-serif">— Marcus Aurelius</p>
                </div>
              </div>

              {/* Card 2 — The Soundscape */}
              <div className="bg-white dark:bg-[#242220] border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <p className="text-xs uppercase tracking-widest font-sans text-slate-500">Sonic Environment</p>
                <div className="mt-4">
                  <p className="font-serif text-slate-800 dark:text-slate-100 text-xl lg:text-2xl mt-2">Autumn Jazz & Rain</p>
                  <p className="text-sm text-slate-500 mt-1 font-sans">Audio queued for deep focus.</p>
                  <div className="border-b border-[#B89B72]/50 w-1/3 mt-3"></div>
                </div>
              </div>

              {/* Card 3 — The Lexicon */}
              <div className="bg-white dark:bg-[#242220] border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <p className="text-xs uppercase tracking-widest font-sans text-slate-500">The Lexicon</p>
                <div className="mt-4">
                  <p className="font-serif text-slate-800 dark:text-slate-100 text-xl lg:text-2xl mt-2">Sonder (n.)</p>
                  <p className="text-sm text-slate-500 mt-1 font-sans leading-relaxed">The realization that every passerby has a life as vivid as your own.</p>
                  <div className="border-b border-[#4E7F65]/50 w-1/3 mt-3"></div>
                </div>
              </div>

              {/* Card 4 — The Ritual */}
              <div className="bg-white dark:bg-[#242220] border border-slate-200 dark:border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                <p className="text-xs uppercase tracking-widest font-sans text-slate-500">Mindful Moment</p>
                <div className="mt-4">
                  <p className="font-serif text-slate-800 dark:text-slate-100 text-xl lg:text-2xl mt-2">Rest your eyes.</p>
                  <p className="text-sm text-slate-500 mt-1 font-sans">Look at something 20 feet away.</p>
                  <div className="border-b border-[#8C4A4A]/50 w-1/3 mt-3"></div>
                </div>
              </div>

            </div>
          </section>

          {/* Manual Attendance Tracker */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-2xl ${serifTitle}`}>Attendance Tracker</h2>
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className={`bg-transparent border-b border-slate-300 dark:border-slate-700 outline-none pb-1 font-sans text-sm text-slate-800 dark:text-slate-200 focus:border-[#4E7F65] transition-colors`}
              />
            </div>

            {courses.length === 0 ? (
              <div className={`${cardClass} flex flex-col items-center justify-center py-12`}>
                <p className={`text-sm italic ${sansText}`}>You are not enrolled in any courses yet.</p>
              </div>
            ) : (
              <div className={`${cardClass} max-h-[400px] overflow-y-auto scrollbar-thin`}>
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
                        
                        {/* Column 2: Visuals */}
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden flex-1">
                            <div className="bg-[#4E7F65] h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                          </div>
                          <span className={`text-sm font-semibold ${sansText} min-w-[40px] text-right`}>{percentage}%</span>
                        </div>

                        {/* Column 3: Attendance Ratio */}
                        <div className={`text-xs uppercase tracking-widest font-semibold text-center ${sansText}`}>
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
            <h2 className={`text-2xl mb-6 ${serifTitle}`}>Activity & Deadlines</h2>
            <div className={`${cardClass} grid grid-cols-1 md:grid-cols-2 gap-12`}>

              {/* Left Column: Form + Heatmap */}
              <div className="space-y-10">
                {/* Add Deadline Form */}
                <form onSubmit={handleAddDeadline} className="space-y-4">
                  <div>
                    <label className={`block text-xs uppercase tracking-widest font-semibold mb-1 ${sansText}`}>Assignment/Exam Title</label>
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
                    <label className={`block text-xs uppercase tracking-widest font-semibold mb-1 ${sansText}`}>Subject</label>
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
                      <label className={`block text-xs uppercase tracking-widest font-semibold mb-1 ${sansText}`}>Date</label>
                      <input
                        type="date"
                        required
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 py-2 outline-none focus:border-[#B89B72] dark:focus:border-[#B89B72] transition-colors font-sans text-sm"
                      />
                    </div>
                    <div>
                      <label className={`block text-xs uppercase tracking-widest font-semibold mb-1 ${sansText}`}>Priority</label>
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
                  <h3 className={`text-sm font-semibold uppercase tracking-widest mb-4 ${sansText}`}>12-Week Activity</h3>
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
                <h3 className={`text-sm font-semibold uppercase tracking-widest mb-6 ${sansText}`}>Upcoming</h3>
                <div className="space-y-4 overflow-y-auto flex-1 pr-2 hide-scrollbar">
                  {upcomingDeadlines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-60">
                      <p className={`text-sm italic text-center ${sansText}`}>No upcoming deadlines.<br />You're all caught up!</p>
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
                          <p className={`text-sm font-medium ${serifTitle} mb-1 leading-tight`}>{deadline.title}</p>
                          <p className={`text-xs ${sansText}`}>
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
            <h2 className={`text-xl mb-6 mt-2 ${serifTitle}`}>Focus Hub</h2>
            <h3 className={`text-7xl font-serif mb-8 tracking-tighter ${serifTitle}`}>
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
              <label className={`block text-xs uppercase tracking-widest font-semibold mb-2 ${sansText}`}>Session Log</label>
              <input
                type="text"
                value={focusSessionText}
                onChange={(e) => setFocusSessionText(e.target.value)}
                placeholder="What did you focus on?"
                className="w-full bg-transparent border-b border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 py-2 outline-none focus:border-[#B89B72] dark:focus:border-[#B89B72] transition-colors font-sans text-sm"
              />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
