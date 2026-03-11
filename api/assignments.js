// 📁 api/assignments.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const assignmentsPath = path.join(__dirname, '..', 'data', 'assignments.json');

export default async function handler(req, res) {
  try {
    const { method } = req;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (method === 'GET') {
      const data = await fs.readFile(assignmentsPath, 'utf-8');
      const assignments = JSON.parse(data);
      return res.json(assignments);
    }
    
    if (method === 'POST') {
      const { title, subject, dueDate, priority, status } = req.body ?? {};
      
      // Validation
      if (!title || typeof title !== 'string' || !title.trim()) {
        return res.status(400).json({ error: 'title is required' });
      }
      
      if (!subject || typeof subject !== 'string' || !subject.trim()) {
        return res.status(400).json({ error: 'subject is required' });
      }
      
      if (!dueDate || typeof dueDate !== 'string') {
        return res.status(400).json({ error: 'dueDate is required' });
      }
      
      const parsedDate = new Date(dueDate);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'dueDate must be a valid date string' });
      }
      
      const allowedPriorities = ['low', 'medium', 'high'];
      const safePriority = allowedPriorities.includes(priority) ? priority : 'medium';
      
      const data = await fs.readFile(assignmentsPath, 'utf-8');
      const assignments = JSON.parse(data);
      
      const newAssignment = {
        id: Date.now(),
        title: title.trim(),
        subject: subject.trim(),
        dueDate: parsedDate.toISOString(),
        priority: safePriority,
        status: status || 'todo',
        createdAt: new Date().toISOString(),
      };
      
      assignments.push(newAssignment);
      await fs.writeFile(assignmentsPath, JSON.stringify(assignments, null, 2) + '\n', 'utf-8');
      return res.status(201).json(newAssignment);
    }
    
    if (method === 'PATCH') {
      const { id, status } = req.body ?? {};
      
      if (!id) {
        return res.status(400).json({ error: 'id is required' });
      }
      
      const allowedStatuses = ['todo', 'in_progress', 'done'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      
      const data = await fs.readFile(assignmentsPath, 'utf-8');
      const assignments = JSON.parse(data);
      const idx = assignments.findIndex((a) => a && a.id && String(a.id) === String(id));
      
      if (idx === -1) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      
      assignments[idx] = { ...assignments[idx], status };
      await fs.writeFile(assignmentsPath, JSON.stringify(assignments, null, 2) + '\n', 'utf-8');
      return res.json(assignments[idx]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Assignments API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
