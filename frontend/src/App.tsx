import { useEffect, useState } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Assignments from './pages/Assignments';
import Grades from './pages/Grades';
import Settings from './pages/Settings';
import About from './pages/About';
import Schedule from './components/Schedule';
import Login from './pages/Login';
import { useAppContext } from './context/AppContext';
import { ProtectedRoute } from './components/ProtectedRoute';

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

function MainLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDeepWorkMode, setIsDeepWorkMode] = useState(false);
  
  const sidebarWidthClass = isSidebarCollapsed ? "w-20" : "w-64";
  const marginClass = isSidebarCollapsed ? "ml-20" : "ml-64";

  return (
    <div className="min-h-screen flex bg-[var(--bg-page)] dark:bg-[#1A1817] transition-colors duration-300 relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 dark:hidden" style={{ backgroundImage: "radial-gradient(#E2E8F0 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
        <div className="absolute inset-0 hidden dark:block" style={{ backgroundImage: "radial-gradient(#2C2A28 1px, transparent 1px)", backgroundSize: "24px 24px" }}></div>
      </div>
      
      <div className={`${sidebarWidthClass} h-screen fixed top-0 left-0 z-20 transition-all duration-300`}>
        <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      </div>
      
      <div className={`flex-1 ${marginClass} min-h-screen relative z-10 flex flex-col transition-all duration-300`}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard onDeepWorkToggle={setIsDeepWorkMode} />} />
            <Route path="/courses" element={<div className="p-8"><Courses /></div>} />
            <Route path="/assignments" element={<div className="p-8"><Assignments /></div>} />
            <Route path="/grades" element={<div className="p-8"><Grades /></div>} />
            <Route path="/settings" element={<div className="p-8"><Settings /></div>} />
            <Route path="/schedule" element={<div className="p-8"><Schedule /></div>} />
          </Route>
        </Routes>
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

function App() {
  const { theme } = useAppContext();
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  return (
    <ErrorBoundary>
      {isAuthPage ? (
        <div className="flex min-h-screen bg-sage-50 dark:bg-[#1A1817] transition-colors duration-300 w-full">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Login />} />
          </Routes>
        </div>
      ) : (
        <MainLayout />
      )}
    </ErrorBoundary>
  );
}

export default App;
