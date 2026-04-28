import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, // optional if google login
  googleId: { type: String },
  name: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const profileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: String,
  email: String,
  phone: String,
  avatarUrl: String,
  theme: String,
  notificationPrefs: Object,
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  currentStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: () => new Date().toISOString() }
});

const topicSchema = new mongoose.Schema({
  id: String,
  title: String,
  completed: { type: Boolean, default: false }
});

const moduleSchema = new mongoose.Schema({
  id: String,
  title: String,
  topics: [topicSchema]
});

const courseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: String,
  code: String,
  title: String,
  instructor: String,
  credits: Number,
  progress: Number,
  points: Number,
  syllabus: [String],
  modules: [moduleSchema],
  description: String,
  schedule: String,
  intensity: String,
  accent: String,
  createdAt: String,
  updatedAt: String
});

const assignmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: String,
  title: String,
  course: String,
  dueDate: String,
  status: String,
  priority: String
});

const gradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: String,
  code: String,
  credits: Number,
  grade: String,
  points: Number,
  term: String
});

const scheduleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: String,
  title: String,
  subject: String,
  dayOfWeek: Number,
  startTime: String,
  endTime: String,
  type: { type: String },
  location: String,
  createdAt: String
});

const statSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: String,
  value: String,
  change: String,
  trend: String
});

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: String,
  subject: String,
  minutes: Number,
  createdAt: String
});

const deadlineSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  id: String,
  title: String,
  subject: String,
  dueDate: String,
  priority: String,
  createdAt: String
});

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: String,
  subject: String,
  status: String,
  markedAt: String
});

export const User = mongoose.model('User', userSchema);
export const Profile = mongoose.model('Profile', profileSchema);
export const Course = mongoose.model('Course', courseSchema);
export const Assignment = mongoose.model('Assignment', assignmentSchema);
export const Grade = mongoose.model('Grade', gradeSchema);
export const Schedule = mongoose.model('Schedule', scheduleSchema);
export const Stat = mongoose.model('Stat', statSchema);
export const Session = mongoose.model('Session', sessionSchema);
export const Deadline = mongoose.model('Deadline', deadlineSchema);
export const Attendance = mongoose.model('Attendance', attendanceSchema);
