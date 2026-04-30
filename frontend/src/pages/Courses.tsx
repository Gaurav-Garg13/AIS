import { apiFetch } from '../utils/api';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Edit3, Trash2, Search, Loader2, AlertCircle,
  BarChart3, CheckCircle2,
  Award, Target, Calendar, Eye, EyeOff
} from 'lucide-react';

type Course = {
  id: string;
  code: string;
  title: string;
  instructor: string;
  credits: number;
  progress: number;
  syllabus: string[];
  description?: string;
  schedule?: string;
  intensity?: string;
  accent?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
  prerequisites?: string[];
  enrolled?: number;
  status?: 'active' | 'completed' | 'archived';
};

type SortOption = 'progress' | 'title' | 'credits' | 'rating' | 'recent';
type FilterOption = 'all' | 'active' | 'completed' | 'archived';
type ViewMode = 'grid' | 'list';

type AttendanceEntry = {
  subjectId: string;
  status: 'present' | 'absent' | 'late' | 'unmarked';
};

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [attendanceEntries, setAttendanceEntries] = useState<AttendanceEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('progress');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showStats, setShowStats] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [form, setForm] = useState({
    code: '',
    title: '',
    instructor: '',
    credits: 0,
    progress: 0,
    description: '',
    schedule: '',
    intensity: 'Core',
    syllabus: '',
    difficulty: 'Beginner',
    duration: '',
    prerequisites: '',
    enrolled: 0,
    status: 'active' as 'active' | 'completed' | 'archived',
  });

  useEffect(() => {
    const fallback: Course[] = [
      {
        id: 'c1',
        code: 'CS201',
        title: 'Data Structures & Algorithms',
        instructor: 'Dr. Smith',
        credits: 4,
        progress: 75,
        syllabus: ['Arrays', 'Linked Lists', 'Trees', 'Graphs'],
        description: 'Fundamental data structures and algorithms',
        schedule: 'Mon, Wed, Fri · 10:00 - 11:00',
        intensity: 'Core',
        accent: '#3b82f6',
        difficulty: 'Intermediate',
        duration: '16 weeks',
        prerequisites: ['CS101 - Programming Fundamentals'],
        rating: 4.5,
        enrolled: 120,
        status: 'active' as const,
      },
      {
        id: 'c2',
        code: 'CS205',
        title: 'Database Systems',
        instructor: 'Prof. Johnson',
        credits: 3,
        progress: 60,
        syllabus: ['SQL Basics', 'Normalization', 'Transactions'],
        description: 'Introduction to database management',
        schedule: 'Tue, Thu · 14:00 - 15:30',
        intensity: 'Core',
        accent: '#10b981',
        difficulty: 'Beginner',
        duration: '14 weeks',
        prerequisites: ['CS101 - Programming Fundamentals'],
        rating: 4.2,
        enrolled: 85,
        status: 'active' as const,
      },
    ];

    const loadCourses = async () => {
      try {
        const res = await apiFetch('/api/courses');
        if (!res.ok) throw new Error('Failed to load courses');
        const data = await res.json();
        setCourses(data.map((c: any) => ({ ...c, id: c._id || c.id || c.code })));

        try {
          const attRes = await apiFetch('/api/attendance');
          if (attRes.ok) {
            setAttendanceEntries(await attRes.json());
          }
        } catch (err) {
          console.error("Failed to load attendance", err);
        }
      } catch (e) {
        console.error(e);
        setError('Falling back to demo courses (API not reachable).');
        setCourses(fallback);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Filter and sort courses based on search/filter/sort state
  let filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (filterBy !== 'all') {
    filteredCourses = filteredCourses.filter(course => course.status === filterBy);
  }

  filteredCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'progress': return b.progress - a.progress;
      case 'title': return a.title.localeCompare(b.title);
      case 'credits': return b.credits - a.credits;
      case 'rating': return (b.rating || 0) - (a.rating || 0);
      default: return 0;
    }
  });

  // Simple stats from courses array
  const total = courses.length;
  const avgProgress = total === 0 ? 0 : courses.reduce((sum, c) => sum + c.progress, 0) / total;
  const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
  const completed = courses.filter(c => c.status === 'completed' || c.progress === 100).length;
  const stats = { total, avgProgress, totalCredits, completed };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const courseData = {
        code: form.code,
        title: form.title,
        instructor: form.instructor,
        description: form.description,
        schedule: form.schedule,
        intensity: form.intensity,
        credits: Number(form.credits),
        progress: Number(form.progress),
        syllabus: form.syllabus.split(',').map(s => s.trim()).filter(Boolean).length > 0
          ? form.syllabus.split(',').map(s => s.trim()).filter(Boolean)
          : ['General Topics'],
        prerequisites: form.prerequisites.split(',').map(s => s.trim()).filter(Boolean),
        difficulty: form.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
        duration: form.duration,
        status: Number(form.progress) === 100 ? 'completed' : (form.status as 'active' | 'completed' | 'archived'),
      };

      if (editingCourse) {
        const res = await apiFetch(`/api/courses/${editingCourse.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseData),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to update course');
        }
        setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, ...courseData } : c));
      } else {
        const res = await apiFetch('/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...courseData, id: Date.now().toString() }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to create course');
        }
        const newCourse = await res.json();
        setCourses(prev => [...prev, { ...newCourse, id: newCourse._id || newCourse.id || newCourse.code }]);
      }

      setShowAddForm(false);
      setEditingCourse(null);
      setForm({
        code: '',
        title: '',
        instructor: '',
        credits: 0,
        progress: 0,
        description: '',
        schedule: '',
        intensity: 'Core',
        syllabus: '',
        difficulty: 'Beginner',
        duration: '',
        prerequisites: '',
        enrolled: 0,
        status: 'active',
      });
    } catch (e: any) {
      setError(e.message || 'Failed to save course. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      await apiFetch(`/api/courses/${id}`, {
        method: 'DELETE',
      });
      setCourses(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      setError('Failed to delete course. Please try again.');
    }
  };

  const startEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      code: course.code,
      title: course.title,
      instructor: course.instructor,
      credits: course.credits,
      progress: course.progress,
      description: course.description || '',
      schedule: course.schedule || '',
      intensity: course.intensity || 'Core',
      syllabus: course.syllabus.join(', '),
      difficulty: course.difficulty || 'Beginner',
      duration: course.duration || '',
      prerequisites: course.prerequisites?.join(', ') || '',
      enrolled: course.enrolled || 0,
      status: course.status || 'active',
    });
    setShowAddForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects - removed for clean look */}
      <div className="relative z-10 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-editorial">
              Courses
            </h1>
            <p className="text-sage-600 dark:text-gray-300">Manage your courses and track your learning journey</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg border border-sage-300 dark:border-white/20 hover:bg-white/20 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-sage-900 dark:text-white" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg border border-sage-300 dark:border-white/20 hover:bg-white/20 transition-colors"
            >
              {viewMode === 'grid' ? <Eye className="w-4 h-4 text-sage-900 dark:text-white" /> : <EyeOff className="w-4 h-4 text-sage-900 dark:text-white" />}
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add Course
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-sage-300 dark:border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-green-400">+2 this week</span>
                </div>
                <div className="text-2xl font-bold text-sage-900 dark:text-white">{stats.total}</div>
                <div className="text-xs text-sage-600 dark:text-gray-300">Total Courses</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-sage-300 dark:border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-blue-400">On track</span>
                </div>
                <div className="text-2xl font-bold text-sage-900 dark:text-white">{Math.round(stats.avgProgress)}%</div>
                <div className="text-xs text-sage-600 dark:text-gray-300">Avg Progress</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-sage-300 dark:border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  <span className="text-xs text-yellow-400">+1 pending</span>
                </div>
                <div className="text-2xl font-bold text-sage-900 dark:text-white">{stats.totalCredits}</div>
                <div className="text-xs text-sage-600 dark:text-gray-300">Total Credits</div>
              </motion.div>


              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-sage-300 dark:border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs text-purple-400">Awesome!</span>
                </div>
                <div className="text-2xl font-bold text-sage-900 dark:text-white">{stats.completed}</div>
                <div className="text-xs text-sage-600 dark:text-gray-300">Completed</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sage-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search courses, instructors, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/10 backdrop-blur-sm border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white placeholder-sage-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-400/50 transition-all duration-200"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-4 py-3 bg-white dark:bg-white/10 backdrop-blur-sm border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 bg-white dark:bg-white/10 backdrop-blur-sm border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-all duration-200"
            >
              <option value="progress">Sort by Progress</option>
              <option value="title">Sort by Title</option>
              <option value="credits">Sort by Credits</option>
              <option value="rating">Sort by Rating</option>
              <option value="recent">Sort by Recent</option>
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-300">{error}</p>
          </motion.div>
        )}

        {/* Courses Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          <AnimatePresence>
            {filteredCourses.map((course, index) => {
              const courseId = (course as any)._id || course.id || course.code;
              const courseEntries = attendanceEntries.filter(e => e.subjectId === courseId && e.status !== 'unmarked');
              const totalLectures = courseEntries.length;
              const attendedLectures = courseEntries.filter((e) => e.status === 'present' || e.status === 'late').length;
              const attendancePercentage = totalLectures === 0 ? 0 : Math.round((attendedLectures / totalLectures) * 100);

              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white dark:bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-sage-300 dark:border-white/20 hover:bg-white/15 transition-all duration-200 hover:shadow-xl hover:shadow-black/10 ${viewMode === 'list' ? 'flex items-center gap-6' : ''
                    }`}
                >
                  <div className={viewMode === 'list' ? 'flex-1 flex items-center gap-6' : ''}>
                    <div className={`flex items-center gap-3 mb-4 ${viewMode === 'list' ? 'mb-0' : ''}`}>
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: course.accent ? `${course.accent}20` : '#3b82f620' }}
                      >
                        <BookOpen className="w-6 h-6" style={{ color: course.accent || '#3b82f6' }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-blue-300">{course.code}</span>
                        </div>
                        <h3 className="text-sage-900 dark:text-white font-medium">{course.title}</h3>
                        <p className="text-sm text-sage-600 dark:text-gray-300">{course.instructor}</p>
                      </div>
                    </div>

                    <div className={`space-y-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-sage-600 dark:text-gray-300">Progress</span>
                          <span className="text-sage-900 dark:text-white font-medium">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-sage-500 to-[#8aaca5] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mt-3 mb-3">
                        <div className="flex justify-between col-span-2">
                          <span className="text-sage-600 dark:text-gray-300">Credits</span>
                          <span className="text-sage-900 dark:text-white font-medium">{course.credits}</span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-sage-600 dark:text-gray-300">Attendance</span>
                          <span className="text-sage-900 dark:text-white font-medium">{attendancePercentage}% ({attendedLectures}/{totalLectures})</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-500 ${attendancePercentage >= 75 ? 'bg-green-500' : 'bg-orange-500'}`}
                            style={{ width: `${attendancePercentage}%` }}
                          />
                        </div>
                      </div>

                      {course.schedule && (
                        <div className="flex items-center gap-2 text-sm text-sage-600 dark:text-gray-300">
                          <Calendar className="w-4 h-4" />
                          <span>{course.schedule}</span>
                        </div>
                      )}

                      {course.difficulty && (
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${course.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30' :
                              course.difficulty === 'Intermediate' ? 'bg-sage-500/10 text-sage-300 border-amber-400/30' :
                                'bg-rose-500/10 text-rose-300 border-rose-400/30'
                            }`}>
                            {course.difficulty}
                          </span>
                          {course.duration && (
                            <span className="text-xs text-sage-500 dark:text-gray-400">{course.duration}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'ml-auto' : 'mt-4 pt-4 border-t border-sage-200 dark:border-white/10'}`}>
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowCourseDetail(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-sage-900 dark:text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => startEdit(course)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-sage-900 dark:text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-300 rounded-lg hover:bg-red-500/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-sage-600 dark:text-gray-300 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search terms or filters' : 'Get started by adding your first course'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-sage-700 to-sage-800 text-white rounded-lg hover:from-sage-800 hover:to-sage-900 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Add Your First Course
              </button>
            )}
          </motion.div>
        )}

        {/* Course Detail Modal */}
        <AnimatePresence>
          {showCourseDetail && selectedCourse && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 border border-sage-200 dark:border-sage-300 dark:border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-sage-900 dark:text-white">{selectedCourse.title}</h2>
                  <button
                    onClick={() => setShowCourseDetail(false)}
                    className="p-2 text-sage-500 dark:text-gray-400 hover:text-sage-900 dark:text-white transition-colors"
                  >
                    <EyeOff className="w-5 h-5" />
                  </button>
                </div>

                {(() => {
                  if (!selectedCourse) return null;
                  const scId = (selectedCourse as any)._id || selectedCourse.id || selectedCourse.code;
                  const scEntries = attendanceEntries.filter(e => e.subjectId === scId && e.status !== 'unmarked');
                  const scTotal = scEntries.length;
                  const scAttended = scEntries.filter((e) => e.status === 'present' || e.status === 'late').length;
                  const scPercentage = scTotal === 0 ? 0 : Math.round((scAttended / scTotal) * 100);

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-16 h-16 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: selectedCourse.accent ? `${selectedCourse.accent}20` : '#3b82f620' }}
                        >
                          <BookOpen className="w-8 h-8" style={{ color: selectedCourse.accent || '#3b82f6' }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-lg font-medium text-blue-300">{selectedCourse.code}</span>
                          </div>
                          <p className="text-sage-900 dark:text-white font-medium">{selectedCourse.instructor}</p>
                          <p className="text-sage-600 dark:text-gray-300">{selectedCourse.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-sage-600 dark:text-gray-300">Progress</span>
                              <span className="text-sage-900 dark:text-white font-medium">{selectedCourse.progress}%</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-sage-500 to-[#8aaca5] h-2 rounded-full transition-all duration-500"
                                style={{ width: `${selectedCourse.progress}%` }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-sage-600 dark:text-gray-300">Attendance</span>
                              <span className="text-sage-900 dark:text-white font-medium">{scPercentage}% ({scAttended}/{scTotal})</span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${scPercentage >= 75 ? 'bg-green-500' : 'bg-orange-500'}`}
                                style={{ width: `${scPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 text-sm bg-white/5 p-4 rounded-xl">
                          <div className="space-y-1">
                            <span className="text-sage-600 dark:text-gray-400 block text-xs uppercase tracking-wider">Credits</span>
                            <span className="text-sage-900 dark:text-white font-bold text-lg">{selectedCourse.credits}</span>
                          </div>
                        </div>
                      </div>

                      {selectedCourse.syllabus.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-3">Syllabus</h3>
                          <div className="space-y-2">
                            {selectedCourse.syllabus.map((topic, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-sage-600 dark:text-gray-300">
                                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                <span>{topic}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-sage-900 dark:text-white mb-3">Prerequisites</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedCourse.prerequisites.map((prereq, index) => (
                              <span key={index} className="px-3 py-1 bg-white/10 rounded-lg text-sm text-sage-600 dark:text-gray-300">
                                {prereq}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 pt-4 border-t border-sage-300 dark:border-white/20">
                        <button
                          onClick={() => {
                            setShowCourseDetail(false);
                            startEdit(selectedCourse);
                          }}
                          className="flex-1 px-4 py-2 bg-blue-600 text-sage-900 dark:text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit Course
                        </button>
                        <button
                          onClick={() => setShowCourseDetail(false)}
                          className="flex-1 px-4 py-2 bg-white/10 text-sage-900 dark:text-white rounded-lg hover:bg-white/20 transition-colors"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add/Edit Modal */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-900 border border-sage-200 dark:border-sage-300 dark:border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-sage-900 dark:text-white">
                    {editingCourse ? 'Edit Course' : 'Add New Course'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingCourse(null);
                      setForm({
                        code: '',
                        title: '',
                        instructor: '',
                        credits: 0,
                        progress: 0,
                        description: '',
                        schedule: '',
                        intensity: 'Core',
                        syllabus: '',
                        difficulty: 'Beginner',
                        duration: '',
                        prerequisites: '',
                        enrolled: 0,
                        status: 'active',
                      });
                    }}
                    className="p-2 text-sage-500 dark:text-gray-400 hover:text-sage-900 dark:text-white transition-colors"
                  >
                    <EyeOff className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-sage-900 dark:text-white">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Course Code</label>
                        <input
                          type="text"
                          value={form.code}
                          onChange={(e) => setForm({ ...form, code: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Course Title</label>
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Instructor</label>
                        <input
                          type="text"
                          value={form.instructor}
                          onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Difficulty</label>
                        <select
                          value={form.difficulty}
                          onChange={(e) => setForm({ ...form, difficulty: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' })}
                          className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-sage-900 dark:text-white">Course Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Credits</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={form.credits}
                          onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Progress (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={form.progress}
                          onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>



                      <div>
                        <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Status</label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'completed' | 'archived' })}
                          className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Schedule</label>
                        <input
                          type="text"
                          value={form.schedule}
                          onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                          placeholder="Mon, Wed · 10:00 - 11:30"
                          className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Duration</label>
                        <input
                          type="text"
                          value={form.duration}
                          onChange={(e) => setForm({ ...form, duration: e.target.value })}
                          placeholder="16 weeks"
                          className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-sage-900 dark:text-white">Additional Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Syllabus (comma-separated)</label>
                        <input
                          type="text"
                          value={form.syllabus}
                          onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
                          placeholder="Arrays, Linked Lists, Trees, Graphs"
                          className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Prerequisites (comma-separated)</label>
                        <input
                          type="text"
                          value={form.prerequisites}
                          onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
                          placeholder="CS101 - Programming Fundamentals, MATH201 - Linear Algebra"
                          className="w-full px-4 py-3 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-sage-300 dark:border-white/20">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingCourse(null);
                        setForm({
                          code: '',
                          title: '',
                          instructor: '',
                          credits: 0,
                          progress: 0,
                          description: '',
                          schedule: '',
                          intensity: 'Core',
                          syllabus: '',
                          difficulty: 'Beginner',
                          duration: '',
                          prerequisites: '',
                          enrolled: 0,
                          status: 'active',
                        });
                      }}
                      className="flex-1 px-6 py-3 bg-white/10 text-sage-900 dark:text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-sage-700 to-sage-800 text-white rounded-lg hover:from-sage-800 hover:to-sage-900 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {editingCourse ? 'Update Course' : 'Add Course'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
