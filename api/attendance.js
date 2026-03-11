// 📁 api/attendance.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const attendancePath = path.join(__dirname, '..', 'data', 'attendance.json');

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
        const data = await fs.readFile(attendancePath, 'utf-8');
        const entries = JSON.parse(data);
        return res.json(entries);
      } catch (error) {
        // Return empty array if file doesn't exist
        return res.json([]);
      }
    }
    
    if (method === 'POST' && req.url?.includes('/mark')) {
      const { status } = req.body ?? {};
      
      if (!['present', 'absent', 'late'].includes(status)) {
        return res.status(400).json({ error: 'status must be present / absent / late' });
      }
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dayKey = `${year}-${month}-${day}`;
      
      try {
        const data = await fs.readFile(attendancePath, 'utf-8');
        const entries = JSON.parse(data);
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
        
        await fs.writeFile(attendancePath, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
        return res.status(201).json(entry);
      } catch (error) {
        // Create new file if it doesn't exist
        const entries = [{
          date: dayKey,
          status,
          markedAt: now.toISOString(),
        }];
        await fs.writeFile(attendancePath, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
        return res.status(201).json(entries[0]);
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Attendance API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
