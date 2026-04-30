import { apiFetch } from '../utils/api';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Target, BarChart3, Search, Users, Plus, Edit2, Save, X, 
  AlertCircle, CheckCircle, Trash2, RefreshCw
} from 'lucide-react';

type GradeRow = {
  course: string;
  code: string;
  credits: number;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C' | 'C-' | 'D' | 'F';
};

const gradePoints: Record<GradeRow['grade'], number> = {
  'A+': 10,
  'A': 9,
  'A-': 8.5,
  'B+': 8,
  'B': 7,
  'B-': 6.5,
  'C': 6,
  'C-': 5.5,
  'D': 5,
  'F': 0,
};

function computeGpa(data: GradeRow[]): number {
  const totalCredits = data.reduce((sum, r) => sum + r.credits, 0);
  const weighted = data.reduce((sum, r) => sum + r.credits * gradePoints[r.grade], 0);
  if (!totalCredits) return 0;
  return weighted / totalCredits;
}

export default function Grades() {
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'grade' | 'credits' | 'course'>('course');
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingGrade, setEditingGrade] = useState<GradeRow['grade'] | ''>('');
  const [editingCredits, setEditingCredits] = useState<string>('');

  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({ course: '', code: '', credits: '', grade: 'A' });
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load data from backend
  useEffect(() => {
    const loadGrades = async () => {
      try {
        setIsLoading(true);
        const response = await apiFetch('/api/grades');
        if (response.ok) {
          const data = await response.json();
          setRows(data);
        } else {
          // Fallback to default data
          setRows([
            { course: 'Computer Science', code: 'CS101', credits: 4, grade: 'A' },
            { course: 'Mathematics', code: 'MATH201', credits: 3, grade: 'B+' },
            { course: 'Physics', code: 'PHY150', credits: 4, grade: 'A-' },
            { course: 'English Literature', code: 'ENG200', credits: 3, grade: 'B' },
            { course: 'Chemistry', code: 'CHEM101', credits: 4, grade: 'C' },
            { course: 'History', code: 'HIST100', credits: 3, grade: 'A+' },
          ]);
        }
      } catch (error) {
        console.error('Error loading grades:', error);
        // Fallback data
        setRows([
          { course: 'Computer Science', code: 'CS101', credits: 4, grade: 'A' },
          { course: 'Mathematics', code: 'MATH201', credits: 3, grade: 'B+' },
          { course: 'Physics', code: 'PHY150', credits: 4, grade: 'A-' },
          { course: 'English Literature', code: 'ENG200', credits: 3, grade: 'B' },
          { course: 'Chemistry', code: 'CHEM101', credits: 4, grade: 'C' },
          { course: 'History', code: 'HIST100', credits: 3, grade: 'A+' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadGrades();
  }, []);

  // Save data to backend
  const saveGrades = async (updatedRows: GradeRow[]) => {
    try {
      setSaveStatus('saving');
      const response = await apiFetch('/api/grades', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRows),
      });
      
      if (response.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        const errorData = await response.json();
        console.error('Save error:', errorData);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  // Filter and sort rows based on search and sort state
  let filteredAndSortedRows = rows.filter(row =>
    row.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.grade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  filteredAndSortedRows = filteredAndSortedRows.sort((a, b) => {
    switch (sortBy) {
      case 'grade': return a.grade.localeCompare(b.grade);
      case 'credits': return b.credits - a.credits;
      default: return a.course.localeCompare(b.course);
    }
  });

  const gpa = computeGpa(filteredAndSortedRows);
  const totalCredits = filteredAndSortedRows.reduce((sum, r) => sum + r.credits, 0);

  const gradeColors: Record<GradeRow['grade'], string> = {
    'A+': 'bg-gradient-to-r from-sage-700 to-sage-800 text-white border-sage-700',
    'A': 'bg-gradient-to-r from-sage-600 to-sage-700 text-white border-sage-600',
    'A-': 'bg-gradient-to-r from-sage-500 to-sage-600 text-white border-sage-500',
    'B+': 'bg-gradient-to-r from-[#8aaca5] to-[#6b968c] text-white border-[#8aaca5]',
    'B': 'bg-gradient-to-r from-[#a8bfad] to-[#8aaca5] text-sage-900 border-[#a8bfad]',
    'B-': 'bg-gradient-to-r from-[#c8d7cc] to-[#a8bfad] text-sage-900 border-[#c8d7cc]',
    'C': 'bg-gradient-to-r from-[#B89B72] to-[#A0855F] text-white border-[#B89B72]',
    'C-': 'bg-gradient-to-r from-[#D4BFA0] to-[#B89B72] text-sage-900 border-[#D4BFA0]',
    'D': 'bg-gradient-to-r from-[#8C4A4A] to-[#753D3D] text-white border-[#8C4A4A]',
    'F': 'bg-gradient-to-r from-[#6A3232] to-[#542828] text-white border-[#6A3232]',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="heading-editorial">Grades</h1>
            <p className="text-sm text-sage-500 dark:text-gray-400">
              Track your academic performance with detailed grade analysis and GPA calculation.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-sage-500 dark:text-gray-400">GPA</span>
              </div>
              <p className="text-2xl font-bold text-sage-900 dark:text-white">{gpa.toFixed(2)}</p>
              <p className="text-xs text-sage-500 dark:text-gray-400">out of 10</p>
            </div>
            
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-xs text-sage-500 dark:text-gray-400">Credits</span>
              </div>
              <p className="text-2xl font-bold text-sage-900 dark:text-white">{totalCredits}</p>
              <p className="text-xs text-sage-500 dark:text-gray-400">total</p>
            </div>
            
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-sage-500 dark:text-gray-400">Courses</span>
              </div>
              <p className="text-2xl font-bold text-sage-900 dark:text-white">{filteredAndSortedRows.length}</p>
              <p className="text-xs text-sage-500 dark:text-gray-400">total</p>
            </div>
            
            <div className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-gray-200 dark:border-white/10 hidden md:block opacity-0 pointer-events-none"></div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sage-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search courses, codes, or grades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-sage-300 dark:border-white/20 rounded-xl text-sage-900 dark:text-white placeholder-sage-500 dark:placeholder-gray-400 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'grade' | 'credits' | 'points' | 'course')}
              className="px-4 py-2 bg-white/10 border border-sage-300 dark:border-white/20 rounded-xl text-sage-900 dark:text-white focus:outline-none focus:border-white/30 transition-all"
            >
              <option value="course">Sort by Course</option>
              <option value="grade">Sort by Grade</option>
              <option value="credits">Sort by Credits</option>
            </select>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Grade
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => saveGrades(rows)}
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 bg-[#4E7F65] dark:bg-[#3d6650] text-white rounded-xl font-medium hover:bg-[#3d6650] dark:hover:bg-[#2e5040] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saveStatus === 'saving' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle className="w-4 h-4" />
              ) : saveStatus === 'error' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Add New Grade Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 p-6"
          >
            <h3 className="text-lg font-semibold text-sage-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Grade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Course Name</label>
                <input
                  type="text"
                  value={newRow.course}
                  onChange={(e) => setNewRow(prev => ({ ...prev, course: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white placeholder-sage-500 dark:placeholder-gray-400 focus:outline-none focus:border-white/30 transition-all"
                  placeholder="Enter course name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Course Code</label>
                <input
                  type="text"
                  value={newRow.code}
                  onChange={(e) => setNewRow(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white placeholder-sage-500 dark:placeholder-gray-400 focus:outline-none focus:border-white/30 transition-all"
                  placeholder="Enter course code"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Credits</label>
                <input
                  type="number"
                  value={newRow.credits}
                  onChange={(e) => setNewRow(prev => ({ ...prev, credits: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white placeholder-sage-500 dark:placeholder-gray-400 focus:outline-none focus:border-white/30 transition-all"
                  placeholder="Enter credits"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sage-600 dark:text-gray-300 mb-2">Grade</label>
                <select
                  value={newRow.grade}
                  onChange={(e) => setNewRow(prev => ({ ...prev, grade: e.target.value as GradeRow['grade'] }))}
                  className="w-full px-3 py-2 bg-white/10 border border-sage-300 dark:border-white/20 rounded-lg text-sage-900 dark:text-white focus:outline-none focus:border-white/30 transition-all"
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="B-">B-</option>
                  <option value="C">C</option>
                  <option value="C-">C-</option>
                  <option value="D">D</option>
                  <option value="F">F</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (newRow.course && newRow.code && newRow.credits) {
                    const newGrade: GradeRow = {
                      course: newRow.course,
                      code: newRow.code,
                      credits: parseInt(newRow.credits),
                      grade: newRow.grade as GradeRow['grade']
                    };
                    setRows([...rows, newGrade]);
                    setNewRow({ course: '', code: '', credits: '', grade: 'A' });
                    setIsAdding(false);
                    saveGrades([...rows, newGrade]);
                  }
                }}
                className="flex-1 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-700 dark:hover:bg-slate-600 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Grade
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsAdding(false);
                  setNewRow({ course: '', code: '', credits: '', grade: 'A' });
                }}
                className="px-4 py-2 bg-gray-500 text-sage-900 dark:text-white rounded-lg font-medium hover:bg-gray-600 transition-all"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grades Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-white/5 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="text-xs uppercase text-sage-500 dark:text-gray-400 bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Course</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-center">Credits</th>
                <th className="px-4 py-3 text-center">Grade</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredAndSortedRows.map((row, index) => (
                  <motion.tr
                    key={row.code}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-t border-sage-200 dark:border-white/10 hover:bg-white/10"
                  >
                    <td className="px-4 py-3">
                      {editingCode === row.code ? (
                        <input
                          type="text"
                          value={row.course}
                          onChange={(e) => {
                            const updatedRows = rows.map(r => 
                              r.code === row.code ? { ...r, course: e.target.value } : r
                            );
                            setRows(updatedRows);
                          }}
                          className="w-full px-2 py-1 bg-white/10 border border-sage-300 dark:border-white/20 rounded text-sage-900 dark:text-white text-sm focus:outline-none focus:border-white/30"
                        />
                      ) : (
                        <div className="font-medium text-sage-900 dark:text-white">{row.course}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sage-600 dark:text-gray-300 font-mono">{row.code}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingCode === row.code ? (
                        <input
                          type="number"
                          value={row.credits}
                          onChange={(e) => {
                            const updatedRows = rows.map(r => 
                              r.code === row.code ? { ...r, credits: parseInt(e.target.value) || 0 } : r
                            );
                            setRows(updatedRows);
                          }}
                          className="w-16 px-2 py-1 bg-white/10 border border-sage-300 dark:border-white/20 rounded text-sage-900 dark:text-white text-center text-sm focus:outline-none focus:border-white/30"
                        />
                      ) : (
                        <span className="text-sage-900 dark:text-white font-semibold">{row.credits}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {editingCode === row.code ? (
                        <select
                          value={row.grade}
                          onChange={(e) => {
                            const updatedRows = rows.map(r => 
                              r.code === row.code ? { ...r, grade: e.target.value as GradeRow['grade'] } : r
                            );
                            setRows(updatedRows);
                          }}
                          className="px-2 py-1 bg-white/10 border border-sage-300 dark:border-white/20 rounded text-sage-900 dark:text-white text-sm focus:outline-none focus:border-white/30"
                        >
                          <option value="A+">A+</option>
                          <option value="A">A</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B">B</option>
                          <option value="B-">B-</option>
                          <option value="C">C</option>
                          <option value="C-">C-</option>
                          <option value="D">D</option>
                          <option value="F">F</option>
                        </select>
                      ) : (
                        <motion.span
                          key={row.grade}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${gradeColors[row.grade]}`}
                        >
                          {row.grade}
                        </motion.span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {editingCode === row.code ? (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setEditingCode(null);
                                saveGrades(rows);
                              }}
                              className="p-1 text-green-400 hover:text-green-300 transition-colors"
                            >
                              <Save className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setEditingCode(null)}
                              className="p-1 text-sage-500 dark:text-gray-400 hover:text-sage-600 dark:text-gray-300 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          </>
                        ) : (
                          <>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setEditingCode(row.code);
                                setEditingGrade(row.grade);
                                setEditingCredits(String(row.credits));
                              }}
                              className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                const updatedRows = rows.filter(r => r.code !== row.code);
                                setRows(updatedRows);
                                saveGrades(updatedRows);
                              }}
                              className="p-1 text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}