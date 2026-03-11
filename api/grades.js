// 📁 api/grades.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gradesPath = path.join(__dirname, '..', 'data', 'grades.json');

export default async function handler(req, res) {
  try {
    const { method } = req;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (method === 'GET') {
      const data = await fs.readFile(gradesPath, 'utf-8');
      const grades = JSON.parse(data);
      return res.json(grades);
    }
    
    if (method === 'PUT') {
      const gradesArray = req.body ?? [];
      
      if (!Array.isArray(gradesArray)) {
        return res.status(400).json({ error: 'Request body must be an array of grades' });
      }
      
      // Validate grades
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
          return res.status(400).json({ error: `Invalid grade: ${grade.grade}` });
        }
      }
      
      // Sanitize and write
      const sanitizedGrades = gradesArray.map(grade => ({
        course: grade.course.trim(),
        code: grade.code.trim(),
        credits: Number(grade.credits),
        grade: grade.grade,
        ...(grade.points != null && Number.isFinite(Number(grade.points)) ? { points: Number(grade.points) } : {})
      }));
      
      await fs.writeFile(gradesPath, JSON.stringify(sanitizedGrades, null, 2) + '\n', 'utf-8');
      return res.json(sanitizedGrades);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Grades API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
