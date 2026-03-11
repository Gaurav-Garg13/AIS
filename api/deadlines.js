// 📁 api/deadlines.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const deadlinesPath = path.join(__dirname, '..', 'data', 'deadlines.json');

export default async function handler(req, res) {
  try {
    const { method } = req;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (method === 'GET') {
      try {
        const data = await fs.readFile(deadlinesPath, 'utf-8');
        const deadlines = JSON.parse(data);
        return res.json(deadlines);
      } catch (error) {
        // Return empty array if file doesn't exist
        return res.json([]);
      }
    }
    
    if (method === 'POST') {
      const { title, subject, dueDate, priority } = req.body ?? {};
      
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
      
      try {
        const data = await fs.readFile(deadlinesPath, 'utf-8');
        const deadlines = JSON.parse(data);
        
        const newDeadline = {
          id: Date.now(),
          title: title.trim(),
          subject: subject.trim(),
          dueDate: parsedDate.toISOString(),
          priority: safePriority,
          createdAt: new Date().toISOString(),
        };
        
        deadlines.push(newDeadline);
        await fs.writeFile(deadlinesPath, JSON.stringify(deadlines, null, 2) + '\n', 'utf-8');
        return res.status(201).json(newDeadline);
      } catch (error) {
        // Create new file if it doesn't exist
        const deadlines = [{
          id: Date.now(),
          title: title.trim(),
          subject: subject.trim(),
          dueDate: parsedDate.toISOString(),
          priority: safePriority,
          createdAt: new Date().toISOString(),
        }];
        await fs.writeFile(deadlinesPath, JSON.stringify(deadlines, null, 2) + '\n', 'utf-8');
        return res.status(201).json(deadlines[0]);
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Deadlines API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
