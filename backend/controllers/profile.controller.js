import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory path (needed in ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const profilePath = path.join(__dirname, "../../data/profile.json");

// Read profile from the JSON file
export const getProfile = (req, res) => {
  try {
    const contents = readFileSync(profilePath, 'utf-8');
    const profile = JSON.parse(contents);
    res.json(profile);
  } catch (error) {
    console.error('Error reading profile:', error);
    res.status(500).json({ error: 'Failed to load profile' });
  }
};

// Update profile in the JSON file
export const updateProfile = (req, res) => {
  try {
    const { name, email, phone, avatarUrl, theme, notificationPrefs } = req.body || {};

    // Read current profile
    let existing = {};
    try {
      const raw = readFileSync(profilePath, 'utf-8');
      existing = JSON.parse(raw);
    } catch {
      // If file doesn't exist yet, start with empty object
      existing = {};
    }

    // Merge only the fields that were actually sent
    if (typeof name === 'string') existing.name = name;
    if (typeof email === 'string') existing.email = email;
    if (typeof phone === 'string') existing.phone = phone;
    if (typeof avatarUrl === 'string' || avatarUrl === null) existing.avatarUrl = avatarUrl;
    if (theme === 'light' || theme === 'dark') existing.theme = theme;
    if (notificationPrefs && typeof notificationPrefs === 'object') {
      existing.notificationPrefs = notificationPrefs;
    }

    writeFileSync(profilePath, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
    res.json(existing);
  } catch (error) {
    console.error('Error saving profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
