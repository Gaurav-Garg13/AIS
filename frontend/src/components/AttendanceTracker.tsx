import { apiFetch } from '../utils/api';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

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
        <span className="text-2xl font-bold text-sage-900 dark:text-white">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

type AttendanceEntry = {
  _id?: string;
  subjectId: string;
  subjectName: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'unmarked';
};

type Course = {
  _id?: string;
  legacyId?: string;
  code: string;
  title: string;
  accent?: string;
};

const getLocalDateKey = (dateObj: Date = new Date()) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function MiniCalendar({ 
  selectedDate, 
  onSelectDate, 
  attendanceEntries 
}: { 
  selectedDate: string; 
  onSelectDate: (d: string) => void;
  attendanceEntries: AttendanceEntry[];
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const markedDates = new Set(attendanceEntries.filter(e => e.status !== 'unmarked').map(e => e.date));

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const dateKey = getLocalDateKey(d);
      const isSelected = dateKey === selectedDate;
      const isToday = dateKey === getLocalDateKey();
      const hasRecord = markedDates.has(dateKey);

      days.push(
        <button
          key={i}
          onClick={() => onSelectDate(dateKey)}
          className={`relative w-8 h-8 rounded-full flex items-center justify-center text-xs transition-colors
            ${isSelected ? 'bg-sage-600 text-white dark:bg-white dark:text-black' : 'hover:bg-sage-200 dark:hover:bg-white/10 text-sage-800 dark:text-gray-300'}
            ${isToday && !isSelected ? 'border border-sage-500 dark:border-white/50' : ''}
          `}
        >
          {i}
          {hasRecord && !isSelected && (
            <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-500"></span>
          )}
        </button>
      );
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-sage-200 dark:border-white/10 w-full sm:w-auto">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><ChevronLeft size={16} /></button>
        <span className="text-sm font-semibold">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
        <button onClick={nextMonth} className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-full"><ChevronRight size={16} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} className="text-[10px] font-medium text-sage-500 dark:text-gray-400 w-8">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {renderDays()}
      </div>
    </div>
  );
}

export default function AttendanceTracker() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateKey());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, attendanceRes] = await Promise.all([
          apiFetch('/api/courses'),
          apiFetch('/api/attendance')
        ]);
        if (coursesRes.ok && attendanceRes.ok) {
          setCourses(await coursesRes.json());
          setAttendanceEntries(await attendanceRes.json());
        }
      } catch (err) {
        console.error("Failed to load attendance data", err);
      }
    };
    fetchData();
  }, []);

  const markAttendance = async (subjectId: string, subjectName: string, status: AttendanceEntry['status']) => {
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await apiFetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, subjectName, date: selectedDate, status }),
      });
      if (!response.ok) throw new Error('Failed to mark attendance');
      
      const entry = (await response.json()) as AttendanceEntry;
      
      setAttendanceEntries((prev) => {
        const existingIndex = prev.findIndex((e) => e.subjectId === subjectId && e.date === selectedDate);
        if (existingIndex === -1) return [...prev, entry];
        const updated = [...prev];
        updated[existingIndex] = entry;
        return updated;
      });
      
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to mark attendance');
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateSafeMiss = (attended: number, total: number) => {
    if (total === 0) return 0;
    const currentPercentage = (attended / total) * 100;
    if (currentPercentage < 75) return 0;
    const maxMissable = Math.floor((attended - 0.75 * total) / 0.75);
    return Math.max(0, maxMissable);
  };

  const isToday = selectedDate === getLocalDateKey();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/10 hover:border-sage-300 dark:hover:border-white/20 transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-sage-900 dark:text-white">Attendance Tracker</h2>
          <p className="text-sm text-sage-600 dark:text-gray-400 mt-1">
            {isToday ? "Today, " : ""}{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              isCalendarOpen 
                ? 'bg-sage-100 border-sage-300 text-sage-800 dark:bg-white/10 dark:border-white/20 dark:text-white' 
                : 'bg-transparent border-sage-200 text-sage-600 dark:border-white/10 dark:text-gray-300 hover:bg-sage-50 dark:hover:bg-white/5'
            }`}
          >
            <CalendarIcon size={16} />
            <span>Select Date</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden flex justify-end"
          >
            <MiniCalendar 
              selectedDate={selectedDate} 
              onSelectDate={(d) => {
                setSelectedDate(d);
                setIsCalendarOpen(false);
              }}
              attendanceEntries={attendanceEntries}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full py-8 text-center text-sage-500 dark:text-gray-400">
            No courses found. Add courses in the Courses tab to track attendance.
          </div>
        ) : (
          courses.map((course, index) => {
            const courseId = course._id || course.legacyId || course.code;
            
            const courseEntries = attendanceEntries.filter(e => e.subjectId === courseId && e.status !== 'unmarked');
            const totalLectures = courseEntries.length;
            const attendedLectures = courseEntries.filter((e) => e.status === 'present' || e.status === 'late').length;
            const percentage = totalLectures === 0 ? 0 : (attendedLectures / totalLectures) * 100;
            const safeMiss = calculateSafeMiss(attendedLectures, totalLectures);
            const isLow = percentage < 75 && totalLectures > 0;

            const selectedDateEntry = attendanceEntries.find(e => e.subjectId === courseId && e.date === selectedDate);
            const currentDateStatus = selectedDateEntry?.status || 'unmarked';

            return (
              <motion.div
                key={courseId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center bg-sage-50 dark:bg-black/20 rounded-xl p-4 border border-sage-100 dark:border-white/5"
              >
                <CircularProgress percentage={percentage} color={course.accent || '#3B82F6'} size={100} />
                <h3 className="mt-4 font-semibold text-sage-900 dark:text-white text-sm text-center truncate w-full" title={course.title}>
                  {course.code}
                </h3>
                <p className="text-xs text-sage-600 dark:text-gray-400 mt-1">
                  {attendedLectures}/{totalLectures} classes
                </p>
                <div
                  className={`mt-2 px-2 py-1 rounded-full text-[10px] flex items-center gap-1 font-medium ${
                    isLow ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  }`}
                >
                  {isLow && <AlertCircle size={10} />}
                  <span>Safe-Miss: {safeMiss}</span>
                </div>

                <div className="mt-5 w-full pt-4 border-t border-sage-200 dark:border-white/10">
                  <div className="flex gap-1 justify-center w-full">
                    <button
                      onClick={() => markAttendance(courseId, course.title, 'present')}
                      disabled={isSaving}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-colors border ${
                        currentDateStatus === 'present' 
                          ? 'bg-green-500 text-white border-green-600' 
                          : 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/20'
                      }`}
                    >
                      P
                    </button>
                    <button
                      onClick={() => markAttendance(courseId, course.title, 'absent')}
                      disabled={isSaving}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-colors border ${
                        currentDateStatus === 'absent' 
                          ? 'bg-red-500 text-white border-red-600' 
                          : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/20'
                      }`}
                    >
                      A
                    </button>
                    <button
                      onClick={() => markAttendance(courseId, course.title, 'late')}
                      disabled={isSaving}
                      className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold transition-colors border ${
                        currentDateStatus === 'late' 
                          ? 'bg-yellow-500 text-white border-yellow-600' 
                          : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20'
                      }`}
                    >
                      L
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {message && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          {message}
        </div>
      )}
    </motion.div>
  );
}
