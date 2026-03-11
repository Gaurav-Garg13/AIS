import { useEffect, useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Assignments from './pages/Assignments';
import Grades from './pages/Grades';
import Settings from './pages/Settings';
import About from './pages/About';
import Schedule from './components/Schedule';
import { useAppContext } from './context/AppContext';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-4">We encountered an unexpected error. Please refresh the page and try again.</p>
            <details className="text-left text-gray-400 bg-gray-800 p-4 rounded-lg">
              <summary className="cursor-pointer font-medium">Error Details</summary>
              <pre className="mt-2 text-sm overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDeepWorkMode, setIsDeepWorkMode] = useState(false);
  const { theme } = useAppContext();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-[#0B0B0B] overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />

        <div className="flex-1 overflow-y-auto">
          <div className="p-8">
            <Routes>
              <Route path="/" element={<Dashboard onDeepWorkToggle={setIsDeepWorkMode} />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
              <Route path="/schedule" element={<Schedule />} />
            </Routes>
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
    </ErrorBoundary>
  );
}

export default App;
