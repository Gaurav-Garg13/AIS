import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import { Sparkles, TrendingUp, Calendar, Target } from 'lucide-react';

export default function WelcomeHero() {
  const { profile } = useAppContext();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good Morning' : currentHour < 17 ? 'Good Afternoon' : 'Good Evening';
  
  return (
    <div className="relative mb-8">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 bg-white/5 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Welcome Message */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-sage-700 to-sage-900 flex items-center justify-center"
              >
                <Sparkles size={24} className="text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  {greeting}, <span className="bg-gradient-to-r from-sage-600 to-[#8aaca5] bg-clip-text text-transparent">{profile.name}</span>
                </h1>
                <p className="text-gray-300 text-lg">Ready to conquer your academic goals today?</p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8"
            >
              <div className="text-center p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition-all duration-300">
                <Calendar className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-xs text-gray-400">Day Streak</p>
              </div>
              
              <div className="text-center p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition-all duration-300">
                <Target className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">89%</p>
                <p className="text-xs text-gray-400">Weekly Goal</p>
              </div>
              
              <div className="text-center p-4 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition-all duration-300">
                <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">A+</p>
                <p className="text-xs text-gray-400">Avg Grade</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full p-4 bg-gradient-to-r from-[#4E7F65] to-sage-800 text-white rounded-xl font-medium hover:from-sage-800 hover:to-sage-900 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <Calendar size={20} />
              Start Study Session
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full p-4 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2"
            >
              <Target size={20} />
              View Today's Tasks
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-full p-4 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all duration-300 border border-white/10 hover:border-white/20 flex items-center justify-center gap-2"
            >
              <TrendingUp size={20} />
              Check Progress
            </motion.button>
          </motion.div>
        </div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-8 p-6 bg-gradient-to-r from-[#B89B72]/10 to-[#8aaca5]/10 rounded-2xl border border-white/10"
        >
          <blockquote className="text-center">
            <p className="text-lg text-gray-200 italic mb-2">
              "Success is the sum of small efforts repeated day in and day out."
            </p>
            <cite className="text-sm text-gray-400">- Robert Collier</cite>
          </blockquote>
        </motion.div>
      </div>
    </div>
  );
}
