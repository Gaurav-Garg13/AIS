import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, BarChart3, Info, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const menuItems = [
  { icon: Home, label: 'Dashboard', to: '/' },
  { icon: BookOpen, label: 'Courses', to: '/courses' },
  { icon: ClipboardList, label: 'Assignments', to: '/assignments' },
  { icon: BarChart3, label: 'Grades', to: '/grades' },
  { icon: Info, label: 'About', to: '/about' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { profile, theme, setTheme } = useAppContext();

  return (
    <motion.div
      initial={{ width: 240 }}
      animate={{ width: isCollapsed ? 80 : 240 }}
      className="h-screen bg-sage-100 dark:bg-[#0B0B0B] border-r border-sage-200 dark:border-gray-800 flex flex-col relative transition-colors duration-300"
    >
      <div className="p-6 flex items-center justify-between gap-2">
        <motion.div
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          className="flex items-center gap-2"
        >
          {!isCollapsed && (
            <>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
              <span className="font-bold text-sage-900 dark:text-white text-lg transition-colors duration-300">StudyFlow</span>
            </>
          )}
        </motion.div>
        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-[11px] px-2 py-1 rounded-full border border-sage-300 dark:border-white/20 text-sage-700 dark:text-gray-200 hover:bg-sage-200 dark:hover:bg-white/10 transition-colors duration-300"
          >
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        )}
      </div>

      <nav className="flex-1 px-3">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-2 transition-colors duration-300 ${
                isActive 
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' 
                  : 'text-sage-800 dark:text-gray-400 hover:bg-sage-200 dark:hover:bg-white/5 hover:text-sage-900 dark:hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            {!isCollapsed && (
              <span className="text-sm font-medium transition-colors duration-300">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-sage-300 dark:bg-gray-800 rounded-full flex items-center justify-center text-sage-700 dark:text-gray-400 hover:text-sage-900 dark:hover:text-white hover:bg-sage-400 dark:hover:bg-gray-700 transition-colors duration-300"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="p-3 border-t border-sage-200 dark:border-gray-800">
        <div className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-sage-200 dark:hover:bg-white/5 transition-colors duration-300">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sage-900 dark:text-white truncate transition-colors duration-300">{profile.name}</p>
              <p className="text-xs text-sage-600 dark:text-gray-400 truncate transition-colors duration-300">{profile.email}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
