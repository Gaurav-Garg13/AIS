import { readData, writeData, __dirname } from "../utils/file.util.js";
import path from "path";

const schedulePath = path.join(__dirname, "../../data/schedule.json");

export const getSchedule = (req, res) => {
  try {
    const schedule = readData(schedulePath);
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
};

export const createScheduleEntry = (req, res) => {
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

    const schedule = readData(schedulePath);
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
    writeData(schedulePath, schedule);
    res.status(201).json(newEntry);
  } catch (error) {
    console.error('Error writing schedule.json:', error);
    res.status(500).json({ error: 'Failed to save schedule entry' });
  }
};

export const deleteScheduleEntry = (req, res) => {
  try {
    const idParam = req.params.id;
    const schedule = readData(schedulePath);
    const initialLength = schedule.length;
    const filtered = schedule.filter((entry) => String(entry.id) !== String(idParam));

    if (filtered.length === initialLength) {
      return res.status(404).json({ error: 'Schedule entry not found' });
    }

    writeData(schedulePath, filtered);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting from schedule.json:', error);
    res.status(500).json({ error: 'Failed to delete schedule entry' });
  }
};
