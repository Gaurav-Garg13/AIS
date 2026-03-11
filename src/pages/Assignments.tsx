import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, CheckCircle2, Clock, Target, TrendingUp, 
  AlertCircle, Filter, Plus, Search, BarChart3, Star,
  Zap, Users, Award, Eye, EyeOff
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

const sideTasks = [
  'Review notes for 15 min',
  'Refactor last assignment code',
  'Prepare questions for next lecture',
];

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [sortBy, setSortBy] = useState<'due' | 'points' | 'course'>('due');
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    const fallback: Assignment[] = [
      {
        id: 'a1',
        title: 'Implement Linked List',
        course: 'CS201 · DSA',
        due: 'Mar 15',
        status: 'todo',
        points: 40,
      },
      {
        id: 'a2',
        title: 'SQL Joins Worksheet',
        course: 'CS205 · DBMS',
        due: 'Mar 14',
        status: 'in_progress',
        points: 30,
      },
      {
        id: 'a3',
        title: 'React Components Lab',
        course: 'CS210 · Web Dev',
        due: 'Mar 18',
        status: 'done',
        points: 50,
      },
      {
        id: 'a4',
        title: 'Algorithm Analysis Paper',
        course: 'CS201 · DSA',
        due: 'Mar 20',
        status: 'todo',
        points: 60,
      },
      {
        id: 'a5',
        title: 'Database Design Project',
        course: 'CS205 · DBMS',
        due: 'Mar 22',
        status: 'todo',
        points: 45,
      },
    ];

    const load = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/assignments');
        if (!res.ok) throw new Error('Failed to load assignments');
        const data = (await res.json()) as Assignment[];
        setAssignments(data);
      } catch (e) {
        console.error(e);
        setError('Falling back to demo assignments (API not reachable).');
        setAssignments(fallback);
      }
    };
    void load();
  }, []);

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

  const totalPoints = assignments.reduce((sum, a) => sum + a.points, 0);
  const completedPoints = assignments
    .filter((a) => a.status === 'done')
    .reduce((sum, a) => sum + a.points, 0);
  const inProgressPoints = assignments
    .filter((a) => a.status === 'in_progress')
    .reduce((sum, a) => sum + a.points, 0);
  const completionRate = assignments.length > 0 ? Math.round((assignments.filter(a => a.status === 'done').length / assignments.length) * 100) : 0;

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'todo': return 'text-gray-400';
      case 'in_progress': return 'text-blue-400';
      case 'done': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: Status) => {
    switch (status) {
      case 'todo': return 'bg-gray-500/10';
      case 'in_progress': return 'bg-blue-500/10';
      case 'done': return 'bg-green-500/10';
      default: return 'bg-gray-500/10';
    }
  };

  const move = (id: string, next: Status) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, status: next } : a)));
    void (async () => {
      try {
        await fetch(`http://localhost:3000/api/assignments/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
      } catch {
        // ignore for now – optimistic UI
      }
    })();
  };

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
            <h1 className="text-3xl font-bold text-white mb-2">Assignments</h1>
            <p className="text-sm text-gray-400">
              Track and manage your tasks across all courses with smart filtering and sorting.
            </p>
          </div>
          
          {showStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400">Total</span>
                </div>
                <p className="text-2xl font-bold text-white">{totalPoints}</p>
                <p className="text-xs text-gray-400">points</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400">Completed</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{completedPoints}</p>
                <p className="text-xs text-gray-400">points</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400">In Progress</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{inProgressPoints}</p>
                <p className="text-xs text-gray-400">points</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">Rate</span>
                </div>
                <p className="text-2xl font-bold text-purple-400">{completionRate}%</p>
                <p className="text-xs text-gray-400">complete</p>
              </div>
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search assignments or courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as Status | 'all')}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Completed</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'due' | 'points' | 'course')}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-white/30 transition-all"
            >
              <option value="due">Sort by Due Date</option>
              <option value="points">Sort by Points</option>
              <option value="course">Sort by Course</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredAndSortedAssignments.map((assignment, index) => (
            <motion.div
              key={assignment.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="group relative"
            >
              <div className={`relative ${getStatusBg(assignment.status)} backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden`}>
                {/* Status indicator */}
                <div className="absolute top-2 right-2">
                  {assignment.status === 'done' && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                  {assignment.status === 'in_progress' && <Clock className="w-5 h-5 text-blue-400" />}
                  {assignment.status === 'todo' && <Calendar className="w-5 h-5 text-gray-400" />}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1 pr-8">{assignment.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span className="px-2 py-1 bg-white/10 rounded-lg">{assignment.course}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due {assignment.due}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">{assignment.points}</span>
                      <span className={`text-sm ${getStatusColor(assignment.status)}`}>pts</span>
                    </div>
                    
                    <div className="flex gap-1">
                      {assignment.status === 'todo' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => move(assignment.id, 'in_progress')}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          Start
                        </motion.button>
                      )}
                      
                      {assignment.status === 'in_progress' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => move(assignment.id, 'done')}
                          className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          Complete
                        </motion.button>
                      )}
                      
                      {assignment.status === 'done' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => move(assignment.id, 'todo')}
                          className="px-3 py-1.5 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
                        >
                          Reopen
                        </motion.button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute bottom-2 left-2 w-1 h-1 bg-white/30 rounded-full"></div>
                <div className="absolute top-2 right-2 w-1 h-1 bg-white/30 rounded-full"></div>
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
          className="text-center py-12"
        >
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 max-w-md mx-auto">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No assignments found</h3>
            <p className="text-gray-400">
              {searchTerm ? `No assignments match "${searchTerm}"` : 'No assignments match the current filter'}
            </p>
          </div>
        </motion.div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

