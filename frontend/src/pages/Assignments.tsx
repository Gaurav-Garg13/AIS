import { apiFetch } from '../utils/api';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle2, Clock, Target, TrendingUp, 
  AlertCircle, Plus, Search, Star,
  Zap, Trash2, X
} from 'lucide-react';

type Status = 'todo' | 'in_progress' | 'done';

interface Assignment {
  id: string;
  title: string;
  course: string;
  due: string;
  status: Status;
  points: number;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [sortBy, setSortBy] = useState<'due' | 'points' | 'course'>('due');
  const [showStats] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    course: '',
    due: '',
    points: 10,
    status: 'todo' as Status
  });

  const loadAssignments = async () => {
    try {
      const res = await apiFetch('/api/assignments');
      if (!res.ok) throw new Error('Failed to load assignments');
      const data = (await res.json()) as Assignment[];
      setAssignments(data);
    } catch (e) {
      console.error(e);
      setError('Could not connect to server. Check if backend is running.');
    }
  };

  useEffect(() => {
    void loadAssignments();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiFetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to save assignment');
      const newAssignment = await res.json();
      setAssignments(prev => [...prev, newAssignment]);
      setShowModal(false);
      setFormData({ title: '', course: '', due: '', points: 10, status: 'todo' });
    } catch (err) {
      setError('Failed to save assignment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      const res = await apiFetch(`/api/assignments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setAssignments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError('Delete failed');
    }
  };

  const move = async (id: string, next: Status) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)));
    try {
      await apiFetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
    } catch {
      setError('Sync failed');
    }
  };

  const filteredAndSortedAssignments = assignments
    .filter(a => filterStatus === 'all' || a.status === filterStatus)
    .filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.course.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'due') {
        return new Date(a.due).getTime() - new Date(b.due).getTime();
      } else if (sortBy === 'points') {
        return b.points - a.points;
      } else {
        return a.course.localeCompare(b.course);
      }
    });

  const totalPoints = assignments.reduce((sum, a) => sum + (Number(a.points) || 0), 0);
  const completedPoints = assignments
    .filter((a) => a.status === 'done')
    .reduce((sum, a) => sum + (Number(a.points) || 0), 0);
  const inProgressPoints = assignments
    .filter((a) => a.status === 'in_progress')
    .reduce((sum, a) => sum + (Number(a.points) || 0), 0);
  const completionRate = assignments.length > 0 ? Math.round((assignments.filter(a => a.status === 'done').length / assignments.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-editorial">
              Assignments
            </h1>
            <p className="text-sm text-sage-600 dark:text-gray-300">
              Manage your academic tasks and track your completion points.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-700 dark:hover:bg-slate-600 transition-all shadow-sm hover:shadow-md font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Assignment
          </button>
        </div>
          
        {showStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-sage-600 dark:text-gray-400">Total Points</span>
              </div>
              <p className="text-2xl font-bold text-sage-900 dark:text-white">{totalPoints}</p>
            </div>
            
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-sage-600 dark:text-gray-400">Completed</span>
              </div>
              <p className="text-2xl font-bold text-green-400">{completedPoints}</p>
            </div>
            
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-sage-600 dark:text-gray-400">In Progress</span>
              </div>
              <p className="text-2xl font-bold text-yellow-400">{inProgressPoints}</p>
            </div>
            
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-sage-600 dark:text-gray-400">Completion</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">{completionRate}%</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sage-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments or courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-white/10 backdrop-blur-sm border border-sage-300 dark:border-white/20 rounded-xl text-sage-900 dark:text-white placeholder-sage-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-400/50 transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
              className="px-4 py-3 bg-white dark:bg-white/10 border border-sage-300 dark:border-white/20 rounded-xl text-sage-900 dark:text-white focus:outline-none transition-all"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Completed</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'due' | 'points' | 'course')}
              className="px-4 py-3 bg-white dark:bg-white/10 border border-sage-300 dark:border-white/20 rounded-xl text-sage-900 dark:text-white focus:outline-none transition-all"
            >
              <option value="due">Due Date</option>
              <option value="points">Points</option>
              <option value="course">Course</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredAndSortedAssignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group relative"
            >
              <div className={`relative bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-gray-200 dark:border-white/10 hover:border-blue-500/30 transition-all duration-300 overflow-hidden shadow-lg`}>
                <button 
                  onClick={() => handleDelete(assignment.id)}
                  className="absolute top-2 right-2 p-1 text-sage-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      assignment.status === 'done' ? 'bg-green-500/20 text-green-400' : 
                      assignment.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' : 
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {assignment.status === 'done' ? <CheckCircle2 size={20} /> : 
                       assignment.status === 'in_progress' ? <Clock size={20} /> : 
                       <Calendar size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-sage-900 dark:text-white leading-tight">{assignment.title}</h3>
                      <p className="text-xs text-blue-400 font-medium mt-1 uppercase tracking-wider">{assignment.course}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-sage-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>{new Date(assignment.due).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={12} />
                      <span>{assignment.points} pts</span>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    {assignment.status === 'todo' && (
                      <button
                        onClick={() => move(assignment.id, 'in_progress')}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
                      >
                        Start Task
                      </button>
                    )}
                    
                    {assignment.status === 'in_progress' && (
                      <button
                        onClick={() => move(assignment.id, 'done')}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors"
                      >
                        Mark Complete
                      </button>
                    )}
                    
                    {assignment.status === 'done' && (
                      <button
                        onClick={() => move(assignment.id, 'todo')}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-sage-900 dark:text-white rounded-lg text-sm font-bold transition-colors"
                      >
                        Reopen
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredAndSortedAssignments.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-gray-200 dark:border-white/10 max-w-md mx-auto shadow-2xl">
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-sage-900 dark:text-white mb-2">Clean Slate!</h3>
            <p className="text-sage-600 dark:text-gray-400 mb-8">
              {searchTerm ? `No assignments match "${searchTerm}"` : "You've crushed all your tasks! Time to add some new goals."}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
            >
              Add Your First Assignment
            </button>
          </div>
        </motion.div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-sage-900 dark:text-white">New Assignment</h2>
                <button onClick={() => setShowModal(false)} className="text-sage-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-sage-600 dark:text-gray-400 mb-1">Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-sage-200 dark:border-white/10 rounded-xl text-sage-900 dark:text-white outline-none focus:border-blue-500/50"
                    placeholder="e.g. Research Paper"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sage-600 dark:text-gray-400 mb-1">Course / Subject</label>
                  <input
                    required
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({...formData, course: e.target.value})}
                    className="w-full px-4 py-3 bg-white/5 border border-sage-200 dark:border-white/10 rounded-xl text-sage-900 dark:text-white outline-none focus:border-blue-500/50"
                    placeholder="e.g. CS201 DSA"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sage-600 dark:text-gray-400 mb-1">Due Date</label>
                    <input
                      required
                      type="date"
                      value={formData.due}
                      onChange={(e) => setFormData({...formData, due: e.target.value})}
                      className="w-full px-4 py-3 bg-white/5 border border-sage-200 dark:border-white/10 rounded-xl text-sage-900 dark:text-white outline-none focus:border-blue-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-sage-600 dark:text-gray-400 mb-1">Points</label>
                    <input
                      required
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 bg-white/5 border border-sage-200 dark:border-white/10 rounded-xl text-sage-900 dark:text-white outline-none focus:border-blue-500/50"
                    />
                  </div>
                </div>

                <button
                  disabled={isSaving}
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all mt-4 shadow-lg"
                >
                  {isSaving ? 'Creating...' : 'Create Assignment'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}
    </div>
  );
}
