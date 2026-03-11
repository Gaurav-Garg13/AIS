import { readData, writeData, __dirname } from "../utils/file.util.js";
import path from "path";
import crypto from "crypto";

const coursesPath = path.join(__dirname, "../../data/courses.json");
const courseStreamClients = new Set();

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
  const courses = readData(coursesPath);
  const payload = `data: ${JSON.stringify({ type: 'snapshot', courses })}\n\n`;
  for (const client of courseStreamClients) {
    client.write(payload);
  }
}

export const getCourses = (req, res) => {
  try {
    const courses = readData(coursesPath);
    res.json(courses);
  } catch (error) {
    console.error('Error reading courses.json:', error);
    res.status(500).json({ error: 'Failed to load courses' });
  }
};

export const getCoursesStream = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  courseStreamClients.add(res);

  try {
    const courses = readData(coursesPath);
    res.write(`data: ${JSON.stringify({ type: 'snapshot', courses })}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Failed to read courses' })}\n\n`);
  }

  req.on('close', () => {
    courseStreamClients.delete(res);
    res.end();
  });
};

export const createCourse = (req, res) => {
  try {
    const payload = sanitizeCoursePayload(req.body ?? {});
    const courses = readData(coursesPath);

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
    writeData(coursesPath, courses);
    broadcastCoursesSnapshot();
    res.status(201).json(newCourse);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error writing courses.json:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

export const updateCourse = (req, res) => {
  try {
    const id = req.params.id;
    const payload = sanitizeCoursePayload(req.body ?? {}, { partial: true });
    const courses = readData(coursesPath);
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
    writeData(coursesPath, courses);
    broadcastCoursesSnapshot();
    res.json(updatedCourse);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error updating courses.json:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

export const deleteCourse = (req, res) => {
  try {
    const id = req.params.id;
    const courses = readData(coursesPath);
    const filtered = courses.filter((course) => String(course.id) !== String(id));

    if (filtered.length === courses.length) {
      return res.status(404).json({ error: 'Course not found' });
    }

    writeData(coursesPath, filtered);
    broadcastCoursesSnapshot();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting courses.json:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};
