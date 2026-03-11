// 📁 api/courses.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coursesPath = path.join(__dirname, '..', 'data', 'courses.json');

export default async function handler(req, res) {
  try {
    const { method } = req;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (method === 'GET') {
      const data = await fs.readFile(coursesPath, 'utf-8');
      const courses = JSON.parse(data);
      return res.json(courses);
    }
    
    if (method === 'POST') {
      const { course, code, credits, instructor, progress, points, syllabus, description, schedule, intensity, accent } = req.body ?? {};
      
      // Validation
      if (!course || typeof course !== 'string' || !course.trim()) {
        return res.status(400).json({ error: 'course is required' });
      }
      
      if (!code || typeof code !== 'string' || !code.trim()) {
        return res.status(400).json({ error: 'code is required' });
      }
      
      if (!Number.isFinite(Number(credits)) || Number(credits) <= 0) {
        return res.status(400).json({ error: 'credits must be a positive number' });
      }
      
      if (!instructor || typeof instructor !== 'string' || !instructor.trim()) {
        return res.status(400).json({ error: 'instructor is required' });
      }
      
      if (!Array.isArray(syllabus) || syllabus.length === 0) {
        return res.status(400).json({ error: 'syllabus must contain at least one topic' });
      }
      
      // Read existing courses
      const data = await fs.readFile(coursesPath, 'utf-8');
      const courses = JSON.parse(data);
      
      // Check for duplicate code
      if (courses.some((c) => c.code.toLowerCase() === code.toLowerCase())) {
        return res.status(409).json({ error: `Course code "${code}" already exists` });
      }
      
      const newCourse = {
        id: `${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
        course: course.trim(),
        code: code.trim(),
        credits: Number(credits),
        instructor: instructor.trim(),
        progress: Number(progress) || 0,
        points: Number(points) || 0,
        syllabus: syllabus.filter(Boolean),
        description: description?.trim() || '',
        schedule: schedule?.trim() || '',
        intensity: intensity || 'Core',
        accent: accent || '#38bdf8',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      courses.push(newCourse);
      await fs.writeFile(coursesPath, JSON.stringify(courses, null, 2) + '\n', 'utf-8');
      return res.status(201).json(newCourse);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Courses API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
