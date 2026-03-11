import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import Orb from '../components/Orb';

export default function About() {
  const { profile } = useAppContext();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Orb animated background */}
      <div className="absolute inset-0 -z-10">
        <Orb 
          backgroundColor="#000000"
          rotateOnHover={true}
          hoverIntensity={0.3}
          hue={0.7}
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl w-full space-y-8"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Welcome to <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">StudyFlow</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Your intelligent academic companion that transforms how you track, manage, and excel in your educational journey.
            </p>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-2">Student Profile</h3>
                <p className="text-2xl font-bold text-blue-300 mb-1">{profile.name}</p>
                <p className="text-sm text-gray-400">{profile.email}</p>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-2">Academic Tracking</h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                    Attendance & Performance Analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                    Focus Sessions & Study Time
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                    Deadlines & Task Management
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                    Grade Tracking & GPA Calculation
                  </li>
                </ul>
              </div>
            </div>

            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
              <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <h3 className="text-lg font-semibold text-white mb-2">Smart Features</h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                    Real-time Progress Tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                    Intelligent Notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                    Performance Analytics
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                    Goal Setting & Achievement
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">🎯 Purpose Built</h3>
              <p className="text-gray-300 leading-relaxed">
                StudyFlow is specifically designed for students who want to take control of their academic life. 
                Track everything from daily attendance to long-term goals, all in one beautiful interface.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">⚡ Real-time Updates</h3>
              <p className="text-gray-300 leading-relaxed">
                Your data syncs instantly across all features. Add a study session, update your attendance, 
                or set a new deadline - everything updates in real-time.
              </p>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center"
          >
            <p className="text-sm text-gray-400">
              Powered by modern web technologies with your privacy and performance in mind.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

