import { readData, writeData, __dirname } from "../utils/file.util.js";
import path from "path";

const gradesPath = path.join(__dirname, "../../data/grades.json");

export const getGrades = (req, res) => {
  try {
    const grades = readData(gradesPath);
    res.json(grades);
  } catch (error) {
    console.error('Error reading grades.json:', error);
    res.status(500).json({ error: 'Failed to load grades' });
  }
};

export const updateGrades = (req, res) => {
  try {
    const gradesArray = req.body ?? [];
    
    if (!Array.isArray(gradesArray)) {
      return res.status(400).json({ error: 'Request body must be an array of grades' });
    }

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

    const sanitizedGrades = gradesArray.map(grade => ({
      course: grade.course.trim(),
      code: grade.code.trim(),
      credits: Number(grade.credits),
      grade: grade.grade,
      ...(grade.points != null && Number.isFinite(Number(grade.points)) ? { points: Number(grade.points) } : {})
    }));

    writeData(gradesPath, sanitizedGrades);
    res.json(sanitizedGrades);
  } catch (error) {
    console.error('Error updating grades.json:', error);
    res.status(500).json({ error: 'Failed to update grades' });
  }
};

export const createGrade = (req, res) => {
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

    const grades = readData(gradesPath);
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
    writeData(gradesPath, grades);
    res.status(201).json(newRow);
  } catch (error) {
    console.error('Error writing grades.json:', error);
    res.status(500).json({ error: 'Failed to create grade row' });
  }
};

export const updateGrade = (req, res) => {
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

    const grades = readData(gradesPath);
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
    writeData(gradesPath, grades);
    res.json(updated);
  } catch (error) {
    console.error('Error updating grades.json:', error);
    res.status(500).json({ error: 'Failed to update grade' });
  }
};
