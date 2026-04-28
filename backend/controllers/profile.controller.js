import { readData, writeData, __dirname } from "../utils/file.util.js";
import fs from "fs";
import path from "path";

const profilePath = path.join(__dirname, "../../data/profile.json");

export const getProfile = (req, res) => {
  try {
    const contents = fs.readFileSync(profilePath, 'utf-8');
    const parsed = JSON.parse(contents);
    res.json(parsed);
  } catch (error) {
    console.error('Error reading profile.json:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
};

export const updateProfile = (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      avatarUrl,
      theme,
      notificationPrefs,
    } = req.body ?? {};

    const raw = fs.readFileSync(profilePath, 'utf-8').catch(() => '{}');
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

    fs.writeFileSync(profilePath, JSON.stringify(merged, null, 2) + '\n', 'utf-8');
    res.json(merged);
  } catch (error) {
    console.error('Error writing profile.json:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
