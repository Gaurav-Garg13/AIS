import { readData, writeData, __dirname } from "../utils/file.util.js";
import path from "path";

const sessionsPath = path.join(__dirname, "../../data/sessions.json");

export const getSessions = (req, res) => {
  try {
    const sessions = readData(sessionsPath);
    res.json(sessions);
  } catch (error) {
    console.error('Error reading sessions.json:', error);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
};

export const createSession = (req, res) => {
  try {
    const { subject, minutes } = req.body ?? {};
    if (typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ error: 'subject is required' });
    }
    const numericMinutes = Number(minutes);
    if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) {
      return res.status(400).json({ error: 'minutes must be a positive number' });
    }

    const sessions = readData(sessionsPath);
    const newSession = {
      id: Date.now(),
      subject: subject.trim(),
      minutes: numericMinutes,
      createdAt: new Date().toISOString(),
    };
    sessions.push(newSession);
    writeData(sessionsPath, sessions);
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error writing sessions.json:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
};
