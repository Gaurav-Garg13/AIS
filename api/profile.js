// 📁 api/profile.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const profilePath = path.join(__dirname, '..', 'data', 'profile.json');

export default async function handler(req, res) {
  try {
    const { method } = req;
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (method === 'GET') {
      try {
        const contents = await fs.readFile(profilePath, 'utf-8');
        const parsed = JSON.parse(contents);
        return res.json(parsed);
      } catch (error) {
        // Return default profile if file doesn't exist
        const defaultProfile = {
          name: 'Student',
          email: 'student@example.com',
          phone: '',
          avatarUrl: '',
          theme: 'dark',
          notificationPrefs: {
            emailAssignments: true,
            emailGrades: true,
            pushReminders: true,
            newsletter: false
          }
        };
        return res.json(defaultProfile);
      }
    }
    
    if (method === 'PATCH') {
      const {
        name,
        email,
        phone,
        avatarUrl,
        theme,
        notificationPrefs,
      } = req.body ?? {};
      
      try {
        const raw = await fs.readFile(profilePath, 'utf-8').catch(() => '{}');
        const existing = JSON.parse(raw || '{}');
        
        const merged = {
          ...existing,
          ...(typeof name === 'string' ? { name } : {}),
          ...(typeof email === 'string' ? { email } : {}),
          ...(typeof phone === 'string' ? { phone } : {}),
          ...(typeof avatarUrl === 'string' || avatarUrl === null ? { avatarUrl } : {}),
          ...(theme === 'light' || theme === 'dark' ? { theme } : {}),
          ...(notificationPrefs && typeof notificationPrefs === 'object' ? { notificationPrefs } : {}),
        };
        
        await fs.writeFile(profilePath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
        return res.json(merged);
      } catch (error) {
        console.error('Error updating profile:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Profile API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
