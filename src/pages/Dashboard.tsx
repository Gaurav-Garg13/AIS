import QuickStats from '../components/QuickStats';
import AttendanceTracker from '../components/AttendanceTracker';
import MarksAnalytics from '../components/MarksAnalytics';
import FocusHub from '../components/FocusHub';
import AIStudyCompanion from '../components/AIStudyCompanion';
import DeadlineHeatmap from '../components/DeadlineHeatmap';

interface DashboardProps {
  onDeepWorkToggle: (active: boolean) => void;
}

export default function Dashboard({ onDeepWorkToggle }: DashboardProps) {
  return (
    <div className="space-y-6">
      <QuickStats />
      <AttendanceTracker />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MarksAnalytics />
        <FocusHub onDeepWorkToggle={onDeepWorkToggle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AIStudyCompanion />
        <DeadlineHeatmap />
      </div>
    </div>
  );
}

