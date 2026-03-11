import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, Edit3, Trash2, Search, Loader2, AlertCircle, 
  Filter, TrendingUp, Clock, Users, BarChart3, CheckCircle2,
  Award, Target, Calendar, Star, Zap, Eye, EyeOff
} from 'lucide-react';

type Course = {
  id: string;
  code: string;
  title: string;
  instructor: string;
  credits: number;
  progress: number;
  points: number;
  syllabus: string[];
  description?: string;
  schedule?: string;
  intensity?: string;
  accent?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: string;
  prerequisites?: string[];
  rating?: number;
  enrolled?: number;
  status?: 'active' | 'completed' | 'archived';
};

type SortOption = 'progress' | 'title' | 'credits' | 'points' | 'rating' | 'recent';
type FilterOption = 'all' | 'active' | 'completed' | 'archived';
type ViewMode = 'grid' | 'list';

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
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
    credits: '',
    progress: '',
    points: '',
    description: '',
    schedule: '',
    intensity: 'Core',
    syllabus: '',
    difficulty: 'Beginner',
    duration: '',
    prerequisites: '',
    rating: 0,
    enrolled: 0,
    status: 'active' as const,
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
        points: 85,
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
        points: 78,
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
        const res = await fetch('http://localhost:3000/api/courses');
        if (!res.ok) throw new Error('Failed to load courses');
        const data = await res.json();
        setCourses(data);
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

  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses.filter(course =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterBy !== 'all') {
      filtered = filtered.filter(course => course.status === filterBy);
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'progress':
          return b.progress - a.progress;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'credits':
          return b.credits - a.credits;
        case 'points':
          return b.points - a.points;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'recent':
          return 0; // Would need timestamp data
        default:
          return 0;
      }
    });

    return sorted;
  }, [courses, searchTerm, filterBy, sortBy]);

  const stats = useMemo(() => {
    const total = courses.length;
    const avgProgress = courses.reduce((sum, c) => sum + c.progress, 0) / total || 0;
    const totalCredits = courses.reduce((sum, c) => sum + c.credits, 0);
    const totalPoints = courses.reduce((sum, c) => sum + c.points, 0);
    const completed = courses.filter(c => c.status === 'completed').length;
    const avgRating = courses.reduce((sum, c) => sum + (c.rating || 0), 0) / total || 0;

    return { total, avgProgress, totalCredits, totalPoints, completed, avgRating };
  }, [courses]);

  const filteredCourses = filteredAndSortedCourses;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const courseData = {
        ...form,
        credits: Number(form.credits),
        progress: Number(form.progress),
        points: Number(form.points),
        syllabus: form.syllabus.split(',').map(s => s.trim()).filter(Boolean).length > 0 
          ? form.syllabus.split(',').map(s => s.trim()).filter(Boolean)
          : ['General Topics'], // Ensure at least one syllabus item
        prerequisites: form.prerequisites.split(',').map(s => s.trim()).filter(Boolean),
        difficulty: form.difficulty as 'Beginner' | 'Intermediate' | 'Advanced',
        duration: form.duration,
        rating: Number(form.rating),
        enrolled: Number(form.enrolled),
        status: form.status as 'active' | 'completed' | 'archived',
      };

      if (editingCourse) {
        const res = await fetch(`http://localhost:3000/api/courses/${editingCourse.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(courseData),
        });
        if (!res.ok) throw new Error('Failed to update course');
        setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, ...courseData } : c));
      } else {
        const res = await fetch('http://localhost:3000/api/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...courseData, id: Date.now().toString() }),
        });
        if (!res.ok) throw new Error('Failed to create course');
        const newCourse = await res.json();
        setCourses(prev => [...prev, newCourse]);
      }

      setShowAddForm(false);
      setEditingCourse(null);
      setForm({
        code: '',
        title: '',
        instructor: '',
        credits: '',
        progress: '',
        points: '',
        description: '',
        schedule: '',
        intensity: 'Core',
        syllabus: '',
        difficulty: 'Beginner',
        duration: '',
        prerequisites: '',
        rating: 0,
        enrolled: 0,
        status: 'active',
      });
    } catch (e) {
      setError('Failed to save course. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      await fetch(`http://localhost:3000/api/courses/${id}`, {
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
      credits: course.credits.toString(),
      progress: course.progress.toString(),
      points: course.points.toString(),
      description: course.description || '',
      schedule: course.schedule || '',
      intensity: course.intensity || 'Core',
      syllabus: course.syllabus.join(', '),
      difficulty: course.difficulty || 'Beginner',
      duration: course.duration || '',
      prerequisites: course.prerequisites?.join(', ') || '',
      rating: (course.rating || 0).toString(),
      enrolled: (course.enrolled || 0).toString(),
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
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Courses
            </h1>
            <p className="text-gray-300">Manage your courses and track your learning journey</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
            >
              {viewMode === 'grid' ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <BookOpen className="w-5 h-5 text-blue-400" />
                  <span className="text-xs text-green-400">+2 this week</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-gray-300">Total Courses</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <span className="text-xs text-blue-400">On track</span>
                </div>
                <div className="text-2xl font-bold text-white">{Math.round(stats.avgProgress)}%</div>
                <div className="text-xs text-gray-300">Avg Progress</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <Award className="w-5 h-5 text-purple-400" />
                  <span className="text-xs text-yellow-400">+1 pending</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalCredits}</div>
                <div className="text-xs text-gray-300">Total Credits</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-xs text-green-400">Great!</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.avgRating.toFixed(1)}</div>
                <div className="text-xs text-gray-300">Avg Rating</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs text-purple-400">Awesome!</span>
                </div>
                <div className="text-2xl font-bold text-white">{stats.completed}</div>
                <div className="text-xs text-gray-300">Completed</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses, instructors, or topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400/50 transition-all duration-200"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-all duration-200"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-all duration-200"
            >
              <option value="progress">Sort by Progress</option>
              <option value="title">Sort by Title</option>
              <option value="credits">Sort by Credits</option>
              <option value="points">Sort by Points</option>
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
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/15 transition-all duration-200 hover:shadow-xl hover:shadow-black/10 ${
                  viewMode === 'list' ? 'flex items-center gap-6' : ''
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
                        {course.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-yellow-300">{course.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <h3 className="text-white font-medium">{course.title}</h3>
                      <p className="text-sm text-gray-300">{course.instructor}</p>
                      {course.enrolled && (
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-400">{course.enrolled} enrolled</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`space-y-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Progress</span>
                        <span className="text-white font-medium">{course.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Credits</span>
                        <span className="text-white font-medium">{course.credits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Points</span>
                        <span className="text-white font-medium">{course.points}</span>
                      </div>
                    </div>

                    {course.schedule && (
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>{course.schedule}</span>
                      </div>
                    )}

                    {course.difficulty && (
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                          course.difficulty === 'Beginner' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-400/30' :
                          course.difficulty === 'Intermediate' ? 'bg-amber-500/10 text-amber-300 border-amber-400/30' :
                          'bg-rose-500/10 text-rose-300 border-rose-400/30'
                        }`}>
                          {course.difficulty}
                        </span>
                        {course.duration && (
                          <span className="text-xs text-gray-400">{course.duration}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'ml-auto' : 'mt-4 pt-4 border-t border-white/10'}`}>
                  <button
                    onClick={() => {
                      setSelectedCourse(course);
                      setShowCourseDetail(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => startEdit(course)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
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
            ))}
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
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No courses found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search terms or filters' : 'Get started by adding your first course'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                className="bg-gray-900 border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">{selectedCourse.title}</h2>
                  <button
                    onClick={() => setShowCourseDetail(false)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <EyeOff className="w-5 h-5" />
                  </button>
                </div>

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
                        {selectedCourse.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-yellow-300">{selectedCourse.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-white font-medium">{selectedCourse.instructor}</p>
                      <p className="text-gray-300">{selectedCourse.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Progress</span>
                        <span className="text-white font-medium">{selectedCourse.progress}%</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${selectedCourse.progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Credits</span>
                        <span className="text-white font-medium">{selectedCourse.credits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Points</span>
                        <span className="text-white font-medium">{selectedCourse.points}</span>
                      </div>
                    </div>
                  </div>

                  {selectedCourse.syllabus.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-3">Syllabus</h3>
                      <div className="space-y-2">
                        {selectedCourse.syllabus.map((topic, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <span>{topic}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-3">Prerequisites</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedCourse.prerequisites.map((prereq, index) => (
                          <span key={index} className="px-3 py-1 bg-white/10 rounded-lg text-sm text-gray-300">
                            {prereq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-4 border-t border-white/20">
                    <button
                      onClick={() => {
                        setShowCourseDetail(false);
                        startEdit(selectedCourse);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit Course
                    </button>
                    <button
                      onClick={() => setShowCourseDetail(false)}
                      className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
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
                className="bg-gray-900 border border-white/20 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">
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
                        credits: '',
                        progress: '',
                        points: '',
                        description: '',
                        schedule: '',
                        intensity: 'Core',
                        syllabus: '',
                        difficulty: 'Beginner',
                        duration: '',
                        prerequisites: '',
                        rating: 0,
                        enrolled: 0,
                        status: 'active',
                      });
                    }}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <EyeOff className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Course Code</label>
                        <input
                          type="text"
                          required
                          value={form.code}
                          onChange={(e) => setForm({ ...form, code: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Course Title</label>
                        <input
                          type="text"
                          required
                          value={form.title}
                          onChange={(e) => setForm({ ...form, title: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Instructor</label>
                        <input
                          type="text"
                          required
                          value={form.instructor}
                          onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
                        <select
                          value={form.difficulty}
                          onChange={(e) => setForm({ ...form, difficulty: e.target.value as 'Beginner' | 'Intermediate' | 'Advanced' })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Course Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Credits</label>
                        <input
                          type="number"
                          required
                          min="1"
                          max="10"
                          value={form.credits}
                          onChange={(e) => setForm({ ...form, credits: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Progress (%)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          value={form.progress}
                          onChange={(e) => setForm({ ...form, progress: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Points</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={form.points}
                          onChange={(e) => setForm({ ...form, points: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                        <input
                          type="number"
                          min="0"
                          max="5"
                          step="0.1"
                          value={form.rating}
                          onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Enrolled</label>
                        <input
                          type="number"
                          min="0"
                          value={form.enrolled}
                          onChange={(e) => setForm({ ...form, enrolled: Number(e.target.value) })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                        <select
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'completed' | 'archived' })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Schedule</label>
                        <input
                          type="text"
                          value={form.schedule}
                          onChange={(e) => setForm({ ...form, schedule: e.target.value })}
                          placeholder="Mon, Wed · 10:00 - 11:30"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                        <input
                          type="text"
                          value={form.duration}
                          onChange={(e) => setForm({ ...form, duration: e.target.value })}
                          placeholder="16 weeks"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Additional Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Syllabus (comma-separated)</label>
                        <input
                          type="text"
                          value={form.syllabus}
                          onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
                          placeholder="Arrays, Linked Lists, Trees, Graphs"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Prerequisites (comma-separated)</label>
                        <input
                          type="text"
                          value={form.prerequisites}
                          onChange={(e) => setForm({ ...form, prerequisites: e.target.value })}
                          placeholder="CS101 - Programming Fundamentals, MATH201 - Linear Algebra"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-white/20">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingCourse(null);
                        setForm({
                          code: '',
                          title: '',
                          instructor: '',
                          credits: '',
                          progress: '',
                          points: '',
                          description: '',
                          schedule: '',
                          intensity: 'Core',
                          syllabus: '',
                          difficulty: 'Beginner',
                          duration: '',
                          prerequisites: '',
                          rating: 0,
                          enrolled: 0,
                          status: 'active',
                        });
                      }}
                      className="flex-1 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
