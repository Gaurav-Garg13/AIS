import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const statsPath = path.join(__dirname, 'data', 'stats.json');
const sessionsPath = path.join(__dirname, 'data', 'sessions.json');
const attendancePath = path.join(__dirname, 'data', 'attendance.json');
const deadlinesPath = path.join(__dirname, 'data', 'deadlines.json');
const profilePath = path.join(__dirname, 'data', 'profile.json');
const coursesPath = path.join(__dirname, 'data', 'courses.json');
const assignmentsPath = path.join(__dirname, 'data', 'assignments.json');
const gradesPath = path.join(__dirname, 'data', 'grades.json');
const schedulePath = path.join(__dirname, 'data', 'schedule.json');
const courseStreamClients = new Set();

async function readJsonArray(filePath) {
  const fileContents = await fs.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(fileContents);
  if (!Array.isArray(parsed)) {
    throw new Error(`${path.basename(filePath)} must contain an array`);
  }
  return parsed;
}

async function writeJsonArray(filePath, value) {
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf-8');
}

async function readStatsFile() {
  return readJsonArray(statsPath);
}

async function writeStatsFile(stats) {
  await writeJsonArray(statsPath, stats);
}

function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function sanitizeCoursePayload(input, options = {}) {
  const { partial = false } = options;
  const output = {};

  const requireString = (key) => {
    if (input[key] == null) {
      if (!partial) {
        throw new Error(`${key} is required`);
      }
      return;
    }
    if (typeof input[key] !== 'string' || !input[key].trim()) {
      throw new Error(`${key} must be a non-empty string`);
    }
    output[key] = input[key].trim();
  };

  const requireNumber = (key, { min = 0, max = Number.POSITIVE_INFINITY } = {}) => {
    if (input[key] == null) {
      if (!partial) {
        throw new Error(`${key} is required`);
      }
      return;
    }
    const numericValue = Number(input[key]);
    if (!Number.isFinite(numericValue) || numericValue < min || numericValue > max) {
      throw new Error(`${key} must be a number between ${min} and ${max}`);
    }
    output[key] = numericValue;
  };

  requireString('code');
  requireString('title');
  requireString('instructor');
  requireNumber('credits', { min: 1, max: 12 });
  requireNumber('progress', { min: 0, max: 100 });
  requireNumber('points', { min: 0 });

  if (input.syllabus != null || !partial) {
    const syllabus = normalizeStringList(input.syllabus);
    if (!syllabus.length) {
      throw new Error('syllabus must contain at least one topic');
    }
    output.syllabus = syllabus;
  }

  if (input.description != null) {
    if (typeof input.description !== 'string' || !input.description.trim()) {
      throw new Error('description must be a non-empty string');
    }
    output.description = input.description.trim();
  }

  if (input.schedule != null) {
    if (typeof input.schedule !== 'string' || !input.schedule.trim()) {
      throw new Error('schedule must be a non-empty string');
    }
    output.schedule = input.schedule.trim();
  }

  if (input.intensity != null) {
    const allowedIntensity = ['Core', 'Lab', 'Elective'];
    if (!allowedIntensity.includes(input.intensity)) {
      throw new Error(`intensity must be one of ${allowedIntensity.join(', ')}`);
    }
    output.intensity = input.intensity;
  }

  if (input.accent != null) {
    if (typeof input.accent !== 'string' || !/^#[\da-fA-F]{6}$/.test(input.accent.trim())) {
      throw new Error('accent must be a hex color like #38bdf8');
    }
    output.accent = input.accent.trim();
  }

  return output;
}

async function broadcastCoursesSnapshot() {
  if (!courseStreamClients.size) return;
  const courses = await readJsonArray(coursesPath);
  const payload = `data: ${JSON.stringify({ type: 'snapshot', courses })}\n\n`;
  for (const client of courseStreamClients) {
    client.write(payload);
  }
}

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await readStatsFile();
    res.json(stats);
  } catch (error) {
    console.error('Error reading stats.json:', error);
    res.status(500).json({ error: 'Failed to load stats data' });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const courses = await readJsonArray(coursesPath);
    res.json(courses);
  } catch (error) {
    console.error('Error reading courses.json:', error);
    res.status(500).json({ error: 'Failed to load courses' });
  }
});

app.get('/api/courses/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  courseStreamClients.add(res);

  try {
    const courses = await readJsonArray(coursesPath);
    res.write(`data: ${JSON.stringify({ type: 'snapshot', courses })}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to read courses' })}\n\n`);
  }

  req.on('close', () => {
    courseStreamClients.delete(res);
    res.end();
  });
});

app.post('/api/courses', async (req, res) => {
  try {
    const payload = sanitizeCoursePayload(req.body ?? {});
    const courses = await readJsonArray(coursesPath);

    if (courses.some((course) => String(course.code).toLowerCase() === payload.code.toLowerCase())) {
      return res.status(409).json({ error: `Course code "${payload.code}" already exists` });
    }

    const timestamp = new Date().toISOString();
    const newCourse = {
      id: `${payload.code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      ...payload,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    courses.push(newCourse);
    await writeJsonArray(coursesPath, courses);
    await broadcastCoursesSnapshot();
    res.status(201).json(newCourse);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error writing courses.json:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

app.patch('/api/courses/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const payload = sanitizeCoursePayload(req.body ?? {}, { partial: true });
    const courses = await readJsonArray(coursesPath);
    const index = courses.findIndex((course) => String(course.id) === String(id));

    if (index === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (
      payload.code &&
      courses.some(
        (course, courseIndex) =>
          courseIndex !== index &&
          String(course.code).toLowerCase() === payload.code.toLowerCase()
      )
    ) {
      return res.status(409).json({ error: `Course code "${payload.code}" already exists` });
    }

    const updatedCourse = {
      ...courses[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    courses[index] = updatedCourse;
    await writeJsonArray(coursesPath, courses);
    await broadcastCoursesSnapshot();
    res.json(updatedCourse);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error updating courses.json:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const courses = await readJsonArray(coursesPath);
    const filtered = courses.filter((course) => String(course.id) !== String(id));

    if (filtered.length === courses.length) {
      return res.status(404).json({ error: 'Course not found' });
    }

    await writeJsonArray(coursesPath, filtered);
    await broadcastCoursesSnapshot();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting courses.json:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await readJsonArray(assignmentsPath);
    res.json(assignments);
  } catch (error) {
    console.error('Error reading assignments.json:', error);
    res.status(500).json({ error: 'Failed to load assignments' });
  }
});

app.patch('/api/assignments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body ?? {};
    const allowed = ['todo', 'in_progress', 'done'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const assignments = await readJsonArray(assignmentsPath);
    const idx = assignments.findIndex((a) => a && a.id && String(a.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    assignments[idx] = { ...assignments[idx], status };
    await writeJsonArray(assignmentsPath, assignments);
    res.json(assignments[idx]);
  } catch (error) {
    console.error('Error updating assignments.json:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

app.get('/api/grades', async (req, res) => {
  try {
    const grades = await readJsonArray(gradesPath);
    res.json(grades);
  } catch (error) {
    console.error('Error reading grades.json:', error);
    res.status(500).json({ error: 'Failed to load grades' });
  }
});

app.put('/api/grades', async (req, res) => {
  try {
    const gradesArray = req.body ?? [];
    
    if (!Array.isArray(gradesArray)) {
      return res.status(400).json({ error: 'Request body must be an array of grades' });
    }

    // Validate each grade object
    const allowedGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C', 'C-', 'D', 'F'];
    
    for (const grade of gradesArray) {
      if (!grade || typeof grade !== 'object') {
        return res.status(400).json({ error: 'Each grade must be an object' });
      }
      
      if (typeof grade.course !== 'string' || !grade.course.trim()) {
        return res.status(400).json({ error: 'Each grade must have a valid course name' });
      }
      
      if (typeof grade.code !== 'string' || !grade.code.trim()) {
        return res.status(400).json({ error: 'Each grade must have a valid course code' });
      }
      
      if (!Number.isFinite(Number(grade.credits)) || Number(grade.credits) <= 0) {
        return res.status(400).json({ error: 'Each grade must have valid credits > 0' });
      }
      
      if (!allowedGrades.includes(grade.grade)) {
        return res.status(400).json({ error: `Invalid grade: ${grade.grade}. Must be one of: ${allowedGrades.join(', ')}` });
      }
    }

    // Sanitize and write the entire grades array
    const sanitizedGrades = gradesArray.map(grade => ({
      course: grade.course.trim(),
      code: grade.code.trim(),
      credits: Number(grade.credits),
      grade: grade.grade,
      ...(grade.points != null && Number.isFinite(Number(grade.points)) ? { points: Number(grade.points) } : {})
    }));

    await writeJsonArray(gradesPath, sanitizedGrades);
    res.json(sanitizedGrades);
  } catch (error) {
    console.error('Error updating grades.json:', error);
    res.status(500).json({ error: 'Failed to update grades' });
  }
});

app.post('/api/grades', async (req, res) => {
  try {
    const { course, code, credits, grade, points } = req.body ?? {};
    const allowedGrades = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'];

    if (typeof course !== 'string' || !course.trim()) {
      return res.status(400).json({ error: 'course is required' });
    }
    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'code is required' });
    }
    if (!Number.isFinite(Number(credits)) || Number(credits) <= 0) {
      return res.status(400).json({ error: 'credits must be a positive number' });
    }
    if (!allowedGrades.includes(grade)) {
      return res.status(400).json({ error: 'Invalid grade value' });
    }

    const grades = await readJsonArray(gradesPath);
    if (grades.some((g) => g && g.code === code)) {
      return res.status(409).json({ error: `Grade row for code "${code}" already exists` });
    }

    const numericCredits = Number(credits);
    const numericPoints =
      points != null && Number.isFinite(Number(points)) ? Number(points) : undefined;

    const newRow = {
      course: course.trim(),
      code: code.trim(),
      credits: numericCredits,
      grade,
      ...(numericPoints != null ? { points: numericPoints } : {}),
    };

    grades.push(newRow);
    await writeJsonArray(gradesPath, grades);
    res.status(201).json(newRow);
  } catch (error) {
    console.error('Error writing grades.json:', error);
    res.status(500).json({ error: 'Failed to create grade row' });
  }
});

app.patch('/api/grades/:code', async (req, res) => {
  try {
    const code = decodeURIComponent(req.params.code);
    const { course, grade, credits, points } = req.body ?? {};

    const allowedGrades = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'];
    if (grade != null && !allowedGrades.includes(grade)) {
      return res.status(400).json({ error: 'Invalid grade value' });
    }
    if (credits != null && (!Number.isFinite(Number(credits)) || Number(credits) <= 0)) {
      return res.status(400).json({ error: 'credits must be a positive number' });
    }
    if (course != null && (typeof course !== 'string' || !course.trim())) {
      return res.status(400).json({ error: 'course must be a non-empty string' });
    }

    const grades = await readJsonArray(gradesPath);
    const idx = grades.findIndex((g) => g && g.code === code);
    if (idx === -1) {
      return res.status(404).json({ error: `No grade row found for code "${code}"` });
    }

    const numericCredits = credits != null ? Number(credits) : undefined;
    const numericPoints =
      points != null && Number.isFinite(Number(points)) ? Number(points) : undefined;

    const updated = {
      ...grades[idx],
      ...(course != null ? { course: course.trim() } : {}),
      ...(grade != null ? { grade } : {}),
      ...(numericCredits != null ? { credits: numericCredits } : {}),
      ...(numericPoints != null ? { points: numericPoints } : {}),
    };
    grades[idx] = updated;
    await writeJsonArray(gradesPath, grades);
    res.json(updated);
  } catch (error) {
    console.error('Error updating grades.json:', error);
    res.status(500).json({ error: 'Failed to update grade' });
  }
});

app.get('/api/profile', async (req, res) => {
  try {
    const contents = await fs.readFile(profilePath, 'utf-8');
    const parsed = JSON.parse(contents);
    res.json(parsed);
  } catch (error) {
    console.error('Error reading profile.json:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

app.patch('/api/profile', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      avatarUrl,
      theme,
      notificationPrefs,
    } = req.body ?? {};

    const raw = await fs.readFile(profilePath, 'utf-8').catch(() => '{}');
    const existing = JSON.parse(raw || '{}');

    const merged = {
      ...existing,
      ...(typeof name === 'string' ? { name } : {}),
      ...(typeof email === 'string' ? { email } : {}),
      ...(typeof phone === 'string' ? { phone } : {}),
      ...(typeof avatarUrl === 'string' || avatarUrl === null ? { avatarUrl } : {}),
      ...(theme === 'light' || theme === 'dark' ? { theme } : {}),
      ...(notificationPrefs && typeof notificationPrefs === 'object' ? { notificationPrefs } : {}),
    };

    await fs.writeFile(profilePath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
    res.json(merged);
  } catch (error) {
    console.error('Error writing profile.json:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await readJsonArray(sessionsPath);
    res.json(sessions);
  } catch (error) {
    console.error('Error reading sessions.json:', error);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { subject, minutes } = req.body ?? {};
    if (typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: 'subject is required' });
    }
    const numericMinutes = Number(minutes);
    if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) {
      return res.status(400).json({ error: 'minutes must be a positive number' });
    }

    const sessions = await readJsonArray(sessionsPath);
    const newSession = {
      id: Date.now(),
      subject: subject.trim(),
      minutes: numericMinutes,
      createdAt: new Date().toISOString(),
    };
    sessions.push(newSession);
    await writeJsonArray(sessionsPath, sessions);
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error writing sessions.json:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

app.get('/api/attendance', async (req, res) => {
  try {
    const entries = await readJsonArray(attendancePath);
    res.json(entries);
  } catch (error) {
    console.error('Error reading attendance.json:', error);
    res.status(500).json({ error: 'Failed to load attendance' });
  }
});

app.post('/api/attendance/mark', async (req, res) => {
  try {
    const { status } = req.body ?? {};
    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ error: 'status must be present / absent / late' });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dayKey = `${year}-${month}-${day}`; // strict local YYYY-MM-DD

    const entries = await readJsonArray(attendancePath);
    const existingIndex = entries.findIndex((e) => e && e.date === dayKey);
    const entry = {
      date: dayKey,
      status,
      markedAt: now.toISOString(),
    };

    if (existingIndex === -1) {
      entries.push(entry);
    } else {
      entries[existingIndex] = entry;
    }

    await writeJsonArray(attendancePath, entries);
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error writing attendance.json:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

app.get('/api/deadlines', async (req, res) => {
  try {
    const deadlines = await readJsonArray(deadlinesPath);
    res.json(deadlines);
  } catch (error) {
    console.error('Error reading deadlines.json:', error);
    res.status(500).json({ error: 'Failed to load deadlines' });
  }
});

app.post('/api/deadlines', async (req, res) => {
  try {
    const { title, subject, dueDate, priority } = req.body ?? {};
    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: 'subject is required' });
    }
    const parsedDate = new Date(dueDate);
    if (!dueDate || Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: 'dueDate must be a valid date string' });
    }
    const allowedPriorities = ['low', 'medium', 'high'];
    const safePriority = allowedPriorities.includes(priority) ? priority : 'medium';

    const deadlines = await readJsonArray(deadlinesPath);
    const newDeadline = {
      id: Date.now(),
      title: title.trim(),
      subject: subject.trim(),
      dueDate: parsedDate.toISOString(),
      priority: safePriority,
      createdAt: new Date().toISOString(),
    };
    deadlines.push(newDeadline);
    await writeJsonArray(deadlinesPath, deadlines);
    res.status(201).json(newDeadline);
  } catch (error) {
    console.error('Error writing deadlines.json:', error);
    res.status(500).json({ error: 'Failed to save deadline' });
  }
});

app.patch('/api/stats/:label', async (req, res) => {
  try {
    const label = decodeURIComponent(req.params.label);
    const { value, change } = req.body ?? {};

    if (typeof value !== 'string' || typeof change !== 'string') {
      return res.status(400).json({ error: '`value` and `change` must be strings' });
    }

    const stats = await readStatsFile();
    const idx = stats.findIndex((s) => s && typeof s === 'object' && s.label === label);
    if (idx === -1) {
      return res.status(404).json({ error: `No stat found for label "${label}"` });
    }

    stats[idx] = { ...stats[idx], value, change };
    await writeStatsFile(stats);
    res.json(stats[idx]);
  } catch (error) {
    console.error('Error updating stats.json:', error);
    res.status(500).json({ error: 'Failed to update stats data' });
  }
});

app.get('/api/schedule', async (req, res) => {
  try {
    const schedule = await readJsonArray(schedulePath);
    // Sort by dayOfWeek then startTime for consistent ordering
    schedule.sort((a, b) => {
      const dayDiff = (a.dayOfWeek ?? 0) - (b.dayOfWeek ?? 0);
      if (dayDiff !== 0) return dayDiff;
      return String(a.startTime ?? '').localeCompare(String(b.startTime ?? ''));
    });
    res.json(schedule);
  } catch (error) {
    console.error('Error reading schedule.json:', error);
    res.status(500).json({ error: 'Failed to load schedule' });
  }
});

app.post('/api/schedule', async (req, res) => {
  try {
    const { title, subject, dayOfWeek, startTime, endTime, type, location } = req.body ?? {};

    if (typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    if (typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: 'subject is required' });
    }
    const numericDay = Number(dayOfWeek);
    if (!Number.isInteger(numericDay) || numericDay < 0 || numericDay > 6) {
      return res.status(400).json({ error: 'dayOfWeek must be an integer 0-6 (Mon-Sun)' });
    }
    if (typeof startTime !== 'string' || !/^\d{2}:\d{2}$/.test(startTime)) {
      return res.status(400).json({ error: 'startTime must be in HH:MM format' });
    }
    if (typeof endTime !== 'string' || !/^\d{2}:\d{2}$/.test(endTime)) {
      return res.status(400).json({ error: 'endTime must be in HH:MM format' });
    }
    if (endTime <= startTime) {
      return res.status(400).json({ error: 'endTime must be after startTime' });
    }

    const allowedTypes = ['class', 'study', 'exam', 'other'];
    const safeType = allowedTypes.includes(type) ? type : 'study';

    const schedule = await readJsonArray(schedulePath);
    const newEntry = {
      id: Date.now(),
      title: title.trim(),
      subject: subject.trim(),
      dayOfWeek: numericDay,
      startTime,
      endTime,
      type: safeType,
      location: typeof location === 'string' ? location.trim() || undefined : undefined,
      createdAt: new Date().toISOString(),
    };
    schedule.push(newEntry);
    await writeJsonArray(schedulePath, schedule);
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error writing schedule.json:', error);
    res.status(500).json({ error: 'Failed to save schedule entry' });
  }
});

app.delete('/api/schedule/:id', async (req, res) => {
  try {
    const idParam = req.params.id;
    const schedule = await readJsonArray(schedulePath);
    const initialLength = schedule.length;
    const filtered = schedule.filter((entry) => String(entry.id) !== String(idParam));

    if (filtered.length === initialLength) {
      return res.status(404).json({ error: 'Schedule entry not found' });
    }

    await writeJsonArray(schedulePath, filtered);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting from schedule.json:', error);
    res.status(500).json({ error: 'Failed to delete schedule entry' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
