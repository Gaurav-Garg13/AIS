import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, ClipboardList, BarChart3, Info, Settings, ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const menuItems = [
  { icon: Home, label: 'Dashboard', to: '/' },
  { icon: BookOpen, label: 'Courses', to: '/courses' },
  { icon: ClipboardList, label: 'Assignments', to: '/assignments' },
  { icon: BarChart3, label: 'Grades', to: '/grades' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  const { profile, theme, setTheme } = useAppContext();
  const { logout } = useAuth();

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
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sage-900 flex-shrink-0 flex items-center justify-center shadow-sm shadow-sage-900/20">
                <BookOpen size={20} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif italic font-bold tracking-tight text-sage-900 dark:text-white text-xl transition-colors duration-300 leading-none">StudyFlow</span>
                <span className="text-[10px] text-sage-600 dark:text-sage-400 font-medium mt-0.5 whitespace-nowrap">Hi, {profile.name.split(' ')[0]} 👋</span>
              </div>
            </div>
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

      <div className="p-3 border-t border-sage-200 dark:border-gray-800 space-y-2">
        <div className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-300">
          <div className="w-8 h-8 rounded-full flex-shrink-0 bg-sage-200 dark:bg-sage-800 overflow-hidden flex items-center justify-center">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-white" />
            )}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sage-900 dark:text-white truncate transition-colors duration-300">{profile.name}</p>
              <p className="text-xs text-sage-600 dark:text-gray-400 truncate transition-colors duration-300">{profile.email}</p>
            </div>
          )}
        </div>
        
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors duration-300 ${isCollapsed ? 'justify-center' : ''}`}
          title="Log Out"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-medium">Log Out</span>}
        </button>
      </div>
    </motion.div>
  );
}
