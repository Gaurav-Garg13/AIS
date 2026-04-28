import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import { GoogleGenAI } from '@google/genai';

import {
  User, Profile, Course, Assignment, Grade, Schedule, Stat, Session, Deadline, Attendance
} from './models.mjs';

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_development_only';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'dummy_client_id.apps.googleusercontent.com';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerocore';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// MongoDB Connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  if (token == null) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_development_only', (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    console.log('--- ATTEMPTING GOOGLE VERIFICATION (Legacy) ---');
    console.log('Credential Length:', credential.length);
    console.log('Target Client ID:', GOOGLE_CLIENT_ID);
    
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, sub: googleId, picture } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({ email, name, googleId });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    // Initialize profile if not exists
    let profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      profile = new Profile({ userId: user._id, name, email, avatarUrl: picture });
      await profile.save();
    } else if (!profile.avatarUrl) {
      profile.avatarUrl = picture;
      await profile.save();
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('============== GOOGLE OAUTH ERROR (Legacy Server) ==============');
    console.error(error);
    res.status(500).json({ 
      error: 'Failed to authenticate with Google', 
      details: error.message || 'Unknown error occurred in legacy backend verification'
    });
  }
});

// --- API ROUTES (Protected) ---

app.get('/api/gamification/status', authenticateToken, async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    
    // Check if streak needs reset
    const now = new Date();
    const lastActive = new Date(profile.lastActiveDate);
    const diffTime = Math.abs(now - lastActive);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 1) {
      profile.currentStreak = 0; // Streak broken
    } else if (diffDays === 1) {
      profile.currentStreak += 1; // Streak continued
    }
    
    profile.lastActiveDate = now.toISOString();
    await profile.save();
    
    res.json({
      xp: profile.xp || 0,
      level: profile.level || 1,
      currentStreak: profile.currentStreak || 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load gamification status' });
  }
});

app.post('/api/gamification/reward', authenticateToken, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const xpAmount = Number(amount) || 10;
    
    let profile = await Profile.findOne({ userId: req.user.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    
    profile.xp = (profile.xp || 0) + xpAmount;
    
    // Level up logic (every 100 XP is a level)
    const newLevel = Math.floor(profile.xp / 100) + 1;
    const leveledUp = newLevel > (profile.level || 1);
    profile.level = newLevel;
    
    await profile.save();
    res.json({ xp: profile.xp, level: profile.level, leveledUp, message: `Awarded ${xpAmount} XP for ${reason}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to award XP' });
  }
});

app.get('/api/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await Stat.find({ userId: req.user.userId });
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

app.patch('/api/stats/:label', authenticateToken, async (req, res) => {
  try {
    const label = decodeURIComponent(req.params.label);
    const { value, change } = req.body;
    const stat = await Stat.findOneAndUpdate(
      { userId: req.user.userId, label },
      { value, change },
      { new: true, upsert: true }
    );
    res.json(stat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stats' });
  }
});

app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.user.userId });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load courses' });
  }
});

app.post('/api/courses', authenticateToken, async (req, res) => {
  try {
    const payload = req.body;
    const existing = await Course.findOne({ userId: req.user.userId, code: { $regex: new RegExp(`^${payload.code}$`, 'i') } });
    if (existing) return res.status(409).json({ error: `Course code already exists` });

    const newCourse = new Course({
      ...payload,
      id: `${payload.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      userId: req.user.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

app.patch('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    const payload = req.body;
    const course = await Course.findOneAndUpdate(
      { userId: req.user.userId, id: req.params.id },
      { ...payload, updatedAt: new Date().toISOString() },
      { new: true }
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update course' });
  }
});

app.delete('/api/courses/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Course.findOneAndDelete({ userId: req.user.userId, id: req.params.id });
    if (!result) return res.status(404).json({ error: 'Course not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

app.get('/api/assignments', authenticateToken, async (req, res) => {
  try {
    const assignments = await Assignment.find({ userId: req.user.userId });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load assignments' });
  }
});

app.patch('/api/assignments/:id', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const assignment = await Assignment.findOneAndUpdate(
      { userId: req.user.userId, id: req.params.id },
      { status },
      { new: true }
    );
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

app.get('/api/grades', authenticateToken, async (req, res) => {
  try {
    const grades = await Grade.find({ userId: req.user.userId });
    res.json(grades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load grades' });
  }
});

app.put('/api/grades', authenticateToken, async (req, res) => {
  try {
    const gradesArray = req.body;
    await Grade.deleteMany({ userId: req.user.userId });
    const newGrades = gradesArray.map(g => ({ ...g, userId: req.user.userId }));
    const saved = await Grade.insertMany(newGrades);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grades' });
  }
});

app.post('/api/grades', authenticateToken, async (req, res) => {
  try {
    const grade = new Grade({ ...req.body, userId: req.user.userId });
    await grade.save();
    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create grade' });
  }
});

app.patch('/api/grades/:code', authenticateToken, async (req, res) => {
  try {
    const code = decodeURIComponent(req.params.code);
    const grade = await Grade.findOneAndUpdate(
      { userId: req.user.userId, code },
      req.body,
      { new: true }
    );
    if (!grade) return res.status(404).json({ error: 'Grade not found' });
    res.json(grade);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grade' });
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user.userId });
    if (!profile) {
      profile = { theme: 'dark' }; // Default if empty
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

app.patch('/api/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user.userId },
      req.body,
      { new: true, upsert: true }
    );
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.get('/api/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user.userId });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

app.post('/api/sessions/start', authenticateToken, async (req, res) => {
  try {
    const { subject, durationMinutes } = req.body;
    const now = new Date();
    const endTime = new Date(now.getTime() + durationMinutes * 60000);
    
    const session = new Session({
      id: Date.now().toString(),
      userId: req.user.userId,
      subject: subject || 'General',
      status: 'active',
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes,
      createdAt: now.toISOString()
    });
    
    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start session' });
  }
});

app.post('/api/sessions/end', authenticateToken, async (req, res) => {
  try {
    const { sessionId, completed } = req.body;
    const session = await Session.findOneAndUpdate(
      { id: sessionId, userId: req.user.userId },
      { status: completed ? 'completed' : 'abandoned' },
      { new: true }
    );
    
    if (completed && session) {
      const durationHours = session.durationMinutes / 60;
      await Stat.findOneAndUpdate(
        { userId: req.user.userId, label: 'Study Hours' },
        { $inc: { value: Math.round(durationHours) } },
        { upsert: true }
      );
    }
    
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to end session' });
  }
});

app.get('/api/attendance', authenticateToken, async (req, res) => {
  try {
    const entries = await Attendance.find({ userId: req.user.userId });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load attendance' });
  }
});

app.post('/api/attendance/mark', authenticateToken, async (req, res) => {
  try {
    const { status, date, subject } = req.body;
    if (!subject) return res.status(400).json({ error: 'Subject is required' });
    const now = new Date();
    const dateStr = date || now.toISOString().split('T')[0];
    const entry = await Attendance.findOneAndUpdate(
      { userId: req.user.userId, date: dateStr, subject },
      { status, markedAt: now.toISOString() },
      { new: true, upsert: true }
    );
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

app.get('/api/deadlines', authenticateToken, async (req, res) => {
  try {
    const deadlines = await Deadline.find({ userId: req.user.userId });
    res.json(deadlines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load deadlines' });
  }
});

app.post('/api/deadlines', authenticateToken, async (req, res) => {
  try {
    const deadline = new Deadline({
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      userId: req.user.userId
    });
    await deadline.save();
    res.status(201).json(deadline);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save deadline' });
  }
});

app.get('/api/schedule', authenticateToken, async (req, res) => {
  try {
    const schedule = await Schedule.find({ userId: req.user.userId }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load schedule' });
  }
});

app.post('/api/schedule', authenticateToken, async (req, res) => {
  try {
    const schedule = new Schedule({
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      userId: req.user.userId
    });
    await schedule.save();
    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save schedule' });
  }
});

app.delete('/api/schedule/:id', authenticateToken, async (req, res) => {
  try {
    const result = await Schedule.findOneAndDelete({ userId: req.user.userId, id: req.params.id });
    if (!result) return res.status(404).json({ error: 'Schedule entry not found' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete schedule entry' });
  }
});

app.post('/api/chat', authenticateToken, async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  try {
    const assignments = await Assignment.find({ userId: req.user.userId, status: { $ne: 'done' } });
    const attendance = await Attendance.find({ userId: req.user.userId });
    const profile = await Profile.findOne({ userId: req.user.userId });
    
    const contextStr = `
      Student Profile: ${profile?.name || 'Student'} (Level ${profile?.level || 1})
      Open Assignments: ${JSON.stringify(assignments.map(a => ({ title: a.title, due: a.dueDate, course: a.course })))}
      Attendance Log: ${JSON.stringify(attendance.map(a => ({ subject: a.subject, status: a.status, date: a.date })))}
    `;

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const systemInstruction = `You are the AeroCore AI Study Companion. You are a professional, concise, and highly intelligent academic advisor. You are helping a student. Here is their current academic data context: ${contextStr}. Do not mention that you are an AI or reading JSON data. Provide highly specific, actionable advice based on this data. Format beautifully using markdown.`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: { systemInstruction, temperature: 0.7 }
        });
        
        return res.json({ reply: response.text });
      } catch (geminiError) {
        console.error('Gemini API Error, falling back to simulated logic', geminiError);
      }
    }

    // Fallback Simulated Logic
    await new Promise(resolve => setTimeout(resolve, 1200));
    const lowerPrompt = prompt.toLowerCase();
    let reply = "I'm your AI Study Companion! How can I help you today?";

    const totalAtt = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attPercentage = totalAtt > 0 ? (presentCount / totalAtt) * 100 : 100;
    const hasLowAttendance = attPercentage < 75 && totalAtt > 0;
    
    const upcomingAssignments = assignments.filter(a => {
      if(!a.dueDate) return false;
      const due = new Date(a.dueDate);
      const now = new Date();
      return (due.getTime() - now.getTime()) / (1000 * 3600 * 24) < 3;
    });

    if (lowerPrompt.includes('what should i do') || lowerPrompt.includes('priority') || lowerPrompt.includes('plan')) {
      reply = "Here is your contextual action plan based on your current academic data:\n\n";
      let items = 1;
      if (hasLowAttendance) {
        reply += `**${items}. ATTENDANCE ALERT:** Your overall attendance is at ${Math.round(attPercentage)}%. You need to prioritize attending classes immediately.\n\n`;
        items++;
      }
      if (upcomingAssignments.length > 0) {
        reply += `**${items}. URGENT ASSIGNMENTS:** You have ${upcomingAssignments.length} assignment(s) due very soon:\n`;
        upcomingAssignments.forEach(a => {
          reply += `   - **${a.title}** (${a.course}) due on ${a.dueDate}\n`;
        });
        reply += "\n";
        items++;
      } else if (assignments.length > 0) {
        reply += `**${items}. TASKS:** You have ${assignments.length} open assignment(s). Consider starting on **${assignments[0].title}** (${assignments[0].course}).\n\n`;
        items++;
      }
      if (items === 1) reply += "You are completely caught up! Great job.";
    } else {
      reply = `You asked: "${prompt}". \n\n(Tip: For the absolute best responses, please add a free GEMINI_API_KEY to your .env file to enable the real Google Gemini model!)`;
    }

    res.json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

// Fallback logic for serving frontend
app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Legacy Server running on http://localhost:${PORT}`);
  console.log(`Google Client ID Loaded (Legacy): ${GOOGLE_CLIENT_ID ? 'Yes (' + GOOGLE_CLIENT_ID.substring(0, 10) + '...)' : 'NO'}`);
});
