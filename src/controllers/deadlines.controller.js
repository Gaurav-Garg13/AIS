import { readData, writeData, __dirname } from "../utils/file.util.js";
import path from "path";

const deadlinesPath = path.join(__dirname, "../../data/deadlines.json");

export const getDeadlines = (req, res) => {
  try {
    const deadlines = readData(deadlinesPath);
    res.json(deadlines);
  } catch (error) {
    console.error('Error reading deadlines.json:', error);
    res.status(500).json({ error: 'Failed to load deadlines' });
  }
};

export const createDeadline = (req, res) => {
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

    const deadlines = readData(deadlinesPath);
    const newDeadline = {
      id: Date.now(),
      title: title.trim(),
      subject: subject.trim(),
      dueDate: parsedDate.toISOString(),
      priority: safePriority,
      createdAt: new Date().toISOString(),
    };
    deadlines.push(newDeadline);
    writeData(deadlinesPath, deadlines);
    res.status(201).json(newDeadline);
  } catch (error) {
    console.error('Error writing deadlines.json:', error);
    res.status(500).json({ error: 'Failed to save deadline' });
  }
};
