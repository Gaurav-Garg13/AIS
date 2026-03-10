import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import QuickStats from './components/QuickStats';
import AttendanceTracker from './components/AttendanceTracker';
import MarksAnalytics from './components/MarksAnalytics';
import FocusHub from './components/FocusHub';
import AIStudyCompanion from './components/AIStudyCompanion';
import DeadlineHeatmap from './components/DeadlineHeatmap';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDeepWorkMode, setIsDeepWorkMode] = useState(false);

  return (
    <div className="flex h-screen bg-[#0B0B0B] overflow-hidden">
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              Welcome back, Alex
            </h1>
            <p className="text-gray-400">
              Here's what's happening with your studies today
            </p>
          </motion.div>

          <div className="space-y-6">
            <QuickStats />
            <AttendanceTracker />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarksAnalytics />
              <FocusHub onDeepWorkToggle={setIsDeepWorkMode} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIStudyCompanion />
              <DeadlineHeatmap />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isDeepWorkMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-md pointer-events-none z-40"
            style={{ backdropFilter: 'blur(8px)' }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
