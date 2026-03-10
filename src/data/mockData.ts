export const attendanceData = [
  {
    subject: 'Data Structures',
    attended: 42,
    total: 50,
    color: '#3B82F6',
  },
  {
    subject: 'Algorithms',
    attended: 38,
    total: 45,
    color: '#8B5CF6',
  },
  {
    subject: 'Web Development',
    attended: 45,
    total: 48,
    color: '#06B6D4',
  },
  {
    subject: 'Database Systems',
    attended: 40,
    total: 52,
    color: '#10B981',
  },
];

export const marksData = [
  { month: 'Aug', gpa: 3.2, predicted: 3.3 },
  { month: 'Sep', gpa: 3.4, predicted: 3.5 },
  { month: 'Oct', gpa: 3.6, predicted: 3.7 },
  { month: 'Nov', gpa: 3.5, predicted: 3.75 },
  { month: 'Dec', gpa: 3.7, predicted: 3.8 },
  { month: 'Jan', gpa: 3.8, predicted: 3.85 },
  { month: 'Feb', gpa: null, predicted: 3.9 },
  { month: 'Mar', gpa: null, predicted: 3.95 },
];

export const deadlineData = Array.from({ length: 365 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - 365 + i);
  const intensity = Math.random() > 0.7 ? Math.floor(Math.random() * 4) + 1 : 0;
  return {
    date: date.toISOString().split('T')[0],
    count: intensity,
  };
});

export const upcomingDeadlines = [
  {
    title: 'Data Structures Assignment',
    subject: 'DSA',
    dueDate: '2026-03-12',
    priority: 'high',
  },
  {
    title: 'Database Project Submission',
    subject: 'DBMS',
    dueDate: '2026-03-15',
    priority: 'high',
  },
  {
    title: 'Web Dev Quiz',
    subject: 'Web Dev',
    dueDate: '2026-03-18',
    priority: 'medium',
  },
  {
    title: 'Algorithms Mid-term',
    subject: 'Algorithms',
    dueDate: '2026-03-22',
    priority: 'high',
  },
];

export const studySuggestions = [
  'Review Data Structures notes from last week',
  'Complete Web Development practice exercises',
  'Prepare for upcoming Algorithms exam',
  'Work on Database project milestone',
];
