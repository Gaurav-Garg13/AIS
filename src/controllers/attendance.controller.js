import { readData, writeData, __dirname } from "../utils/file.util.js";
import path from "path";

const attendancePath = path.join(__dirname, "../../data/attendance.json");

export const getAttendance = (req, res) => {
  try {
    const entries = readData(attendancePath);
    res.json(entries);
  } catch (error) {
    console.error('Error reading attendance.json:', error);
    res.status(500).json({ error: 'Failed to load attendance' });
  }
};

export const markAttendance = (req, res) => {
  try {
    const { status } = req.body ?? {};
    if (!['present', 'absent', 'late'].includes(status)) {
      return res.status(400).json({ error: 'status must be present / absent / late' });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dayKey = `${year}-${month}-${day}`;

    const entries = readData(attendancePath);
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

    writeData(attendancePath, entries);
    res.status(201).json(entry);
  } catch (error) {
    console.error('Error writing attendance.json:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
};
