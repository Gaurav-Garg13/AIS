import { readData, writeData, __dirname } from "../utils/file.util.js";
import path from "path";

const assignmentsPath = path.join(__dirname, "../../data/assignments.json");

export const getAssignments = (req, res) => {
  try {
    const assignments = readData(assignmentsPath);
    res.json(assignments);
  } catch (error) {
    console.error('Error reading assignments.json:', error);
    res.status(500).json({ error: 'Failed to load assignments' });
  }
};

export const updateAssignment = (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body ?? {};
    const allowed = ['todo', 'in_progress', 'done'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const assignments = readData(assignmentsPath);
    const idx = assignments.findIndex((a) => a && a.id && String(a.id) === String(id));
    if (idx === -1) {
      return res.status(404).json({ error: 'Assignment not found' });
    }
    assignments[idx] = { ...assignments[idx], status };
    writeData(assignmentsPath, assignments);
    res.json(assignments[idx]);
  } catch (error) {
    console.error('Error updating assignments.json:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
};
