import { motion } from 'framer-motion';
import { Home, TrendingUp, Clock, Brain, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const menuItems = [
  { icon: Home, label: 'Dashboard', active: true },
  { icon: TrendingUp, label: 'Analytics', active: false },
  { icon: Clock, label: 'Focus', active: false },
  { icon: Brain, label: 'AI Assistant', active: false },
  { icon: Calendar, label: 'Schedule', active: false },
];

export default function Sidebar({ isCollapsed, setIsCollapsed }: SidebarProps) {
  return (
    <motion.div
      initial={{ width: 240 }}
      animate={{ width: isCollapsed ? 80 : 240 }}
      className="h-screen bg-[#0B0B0B] border-r border-gray-800 flex flex-col relative"
    >
      <div className="p-6">
        <motion.div
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          className="flex items-center gap-2"
        >
          {!isCollapsed && (
            <>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600" />
              <span className="font-bold text-white text-lg">StudyFlow</span>
            </>
          )}
        </motion.div>
      </div>

      <nav className="flex-1 px-3">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.label}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-2 transition-colors ${
              item.active
                ? 'bg-blue-500/10 text-blue-400'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={20} />
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                {item.label}
              </motion.span>
            )}
          </motion.button>
        ))}
      </nav>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="p-3 border-t border-gray-800">
        <div className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Alex Chen</p>
              <p className="text-xs text-gray-400 truncate">alex@student.edu</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
