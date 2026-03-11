import { readData, writeData, __dirname } from "../utils/file.util.js";
import path from "path";

const statsPath = path.join(__dirname, "../../data/stats.json");

export const getStats = (req, res) => {
  try {
    const stats = readData(statsPath);
    res.json(stats);
  } catch (error) {
    console.error('Error reading stats.json:', error);
    res.status(500).json({ error: 'Failed to load stats data' });
  }
};

export const updateStat = (req, res) => {
  try {
    const label = decodeURIComponent(req.params.label);
    const { value, change } = req.body ?? {};

    if (typeof value !== 'string' || typeof change !== 'string') {
      return res.status(400).json({ error: '`value` and `change` must be strings' });
    }

    const stats = readData(statsPath);
    const idx = stats.findIndex((s) => s && typeof s === 'object' && s.label === label);
    if (idx === -1) {
      return res.status(404).json({ error: `No stat found for label "${label}"` });
    }

    stats[idx] = { ...stats[idx], value, change };
    writeData(statsPath, stats);
    res.json(stats[idx]);
  } catch (error) {
    console.error('Error updating stats.json:', error);
    res.status(500).json({ error: 'Failed to update stats data' });
  }
};
