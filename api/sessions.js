// 📁 api/sessions.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sessionsPath = path.join(__dirname, '..', 'data', 'sessions.json');

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
        const data = await fs.readFile(sessionsPath, 'utf-8');
        const sessions = JSON.parse(data);
        return res.json(sessions);
      } catch (error) {
        // Return empty array if file doesn't exist
        return res.json([]);
      }
    }
    
    if (method === 'POST') {
      const { subject, minutes } = req.body ?? {};
      
      if (!subject || typeof subject !== 'string' || !subject.trim()) {
        return res.status(400).json({ error: 'subject is required' });
      }
      
      const numericMinutes = Number(minutes);
      if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) {
        return res.status(400).json({ error: 'minutes must be a positive number' });
      }
      
      try {
        const data = await fs.readFile(sessionsPath, 'utf-8');
        const sessions = JSON.parse(data);
        
        const newSession = {
          id: Date.now(),
          subject: subject.trim(),
          minutes: numericMinutes,
          createdAt: new Date().toISOString(),
        };
        
        sessions.push(newSession);
        await fs.writeFile(sessionsPath, JSON.stringify(sessions, null, 2) + '\n', 'utf-8');
        return res.status(201).json(newSession);
      } catch (error) {
        // Create new file if it doesn't exist
        const sessions = [{
          id: Date.now(),
          subject: subject.trim(),
          minutes: numericMinutes,
          createdAt: new Date().toISOString(),
        }];
        await fs.writeFile(sessionsPath, JSON.stringify(sessions, null, 2) + '\n', 'utf-8');
        return res.status(201).json(sessions[0]);
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Sessions API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
