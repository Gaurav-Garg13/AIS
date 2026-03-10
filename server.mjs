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

app.get('/api/stats', async (req, res) => {
  try {
    const stats = await readStatsFile();
    res.json(stats);
  } catch (error) {
    console.error('Error reading stats.json:', error);
    res.status(500).json({ error: 'Failed to load stats data' });
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
    const dayKey = now.toISOString().slice(0, 10);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

