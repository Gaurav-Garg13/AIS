import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Target, Trophy, Flame, Clock, Pencil, X } from 'lucide-react';

const iconMap = {
  Target,
  Trophy,
  Flame,
  Clock,
} as const;

type IconKey = keyof typeof iconMap;

type Stat = {
  icon: IconKey;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  change: string;
};

const fallbackStats: Stat[] = [
  {
    icon: 'Target',
    label: 'Current Streak',
    value: '12 days',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-500/10',
    change: '+3 from last week',
  },
  {
    icon: 'Trophy',
    label: 'Total Points',
    value: '2,847',
    color: 'from-yellow-500 to-orange-500',
    bgColor: 'bg-yellow-500/10',
    change: '+156 this week',
  },
  {
    icon: 'Flame',
    label: 'Study Hours',
    value: '34.5h',
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-500/10',
    change: '+5.2h this week',
  },
  {
    icon: 'Clock',
    label: 'Avg. Session',
    value: '52 min',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500/10',
    change: '+8 min',
  },
];

export default function QuickStats() {
  const [stats, setStats] = useState<Stat[]>(fallbackStats);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [valueInput, setValueInput] = useState('');
  const [changeInput, setChangeInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data: Stat[] = await response.json();
        setStats(data);
      } catch (error) {
        // If the server is not running or request fails, we silently use fallbackStats.
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const editingStat = useMemo(
    () => (editingLabel ? stats.find((s) => s.label === editingLabel) : undefined),
    [editingLabel, stats]
  );

  useEffect(() => {
    if (!editingStat) return;
    setValueInput(editingStat.value);
    setChangeInput(editingStat.change);
    setSaveError(null);
  }, [editingStat]);

  const saveSelected = async () => {
    if (!editingLabel) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const response = await fetch(
        `http://localhost:3000/api/stats/${encodeURIComponent(editingLabel)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value: valueInput, change: changeInput }),
        }
      );

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? 'Failed to save');
      }

      const updated: Stat = await response.json();
      setStats((prev) => prev.map((s) => (s.label === updated.label ? updated : s)));
      setEditingLabel(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.03, y: -3 }}
            className={`${stat.bgColor} backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all`}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
              >
                {(() => {
                  const IconComponent = iconMap[stat.icon] ?? Target;
                  return <IconComponent size={24} className="text-white" />;
                })()}
              </div>

              <button
                type="button"
                onClick={() => setEditingLabel(stat.label)}
                className="inline-flex items-center gap-2 rounded-xl bg-black/30 text-white border border-white/10 px-3 py-2 hover:border-white/20"
              >
                <Pencil size={16} />
                <span className="text-sm font-medium">Edit</span>
              </button>
            </div>

            <div>
              <p className="text-3xl font-bold text-white mb-1">
                {isLoading ? 'Loading...' : stat.value}
              </p>
              <p className="text-sm text-gray-400 mb-2">{stat.label}</p>
              <p className="text-xs text-green-400">{stat.change}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {editingLabel && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => (isSaving ? null : setEditingLabel(null))}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0B0B0B] p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white text-lg font-semibold">Edit stat</p>
                  <p className="text-gray-400 text-sm">{editingLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => (isSaving ? null : setEditingLabel(null))}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white hover:border-white/20"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Value</label>
                  <input
                    value={valueInput}
                    onChange={(e) => setValueInput(e.target.value)}
                    className="w-full rounded-xl bg-black/40 text-white border border-white/10 px-3 py-2 outline-none focus:border-white/20"
                    placeholder="e.g. 20 days"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Change text</label>
                  <input
                    value={changeInput}
                    onChange={(e) => setChangeInput(e.target.value)}
                    className="w-full rounded-xl bg-black/40 text-white border border-white/10 px-3 py-2 outline-none focus:border-white/20"
                    placeholder="e.g. +2 from last week"
                  />
                </div>
              </div>

              {saveError && <p className="mt-3 text-sm text-red-400">{saveError}</p>}

              <div className="mt-5 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-400">
                  Saves into <span className="text-gray-200">data/stats.json</span> via server
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLabel(null)}
                    disabled={isSaving}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white font-semibold disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveSelected}
                    disabled={isSaving || !editingLabel}
                    className="rounded-xl bg-white text-black px-4 py-2 font-semibold disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
