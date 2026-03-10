import { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Sparkles } from 'lucide-react';
import { marksData } from '../data/mockData';

export default function MarksAnalytics() {
  const [showPrediction, setShowPrediction] = useState(false);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3">
          <p className="text-gray-400 text-xs">{payload[0].payload.month}</p>
          <p className="text-white font-bold">GPA: {payload[0].value.toFixed(2)}</p>
          {showPrediction && payload[1] && (
            <p className="text-purple-400 text-sm">Predicted: {payload[1].value.toFixed(2)}</p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Marks Analytics</h2>
            <p className="text-xs text-gray-400">Performance trends over time</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPrediction(!showPrediction)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            showPrediction
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <Sparkles size={16} />
          AI Prediction
        </motion.button>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={marksData}>
            <defs>
              <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
            <YAxis domain={[0, 4]} stroke="#6B7280" style={{ fontSize: '12px' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="gpa"
              stroke="#3B82F6"
              strokeWidth={3}
              fill="url(#colorGpa)"
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            />
            {showPrediction && (
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="#A855F7"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorPredicted)"
                dot={{ fill: '#A855F7', strokeWidth: 2, r: 3 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
        <div>
          <p className="text-gray-400 text-xs">Current GPA</p>
          <p className="text-2xl font-bold text-white mt-1">3.8</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Improvement</p>
          <p className="text-2xl font-bold text-green-400 mt-1">+0.6</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Target GPA</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">4.0</p>
        </div>
      </div>
    </motion.div>
  );
}
