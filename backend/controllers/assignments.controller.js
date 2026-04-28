import Assignment from "../models/Assignment.js";

export const getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ userId: req.user._id });
    const formatted = assignments.map(a => ({ ...a.toObject(), id: a._id }));
    res.json(formatted);
  } catch (error) {
    console.error("Error reading assignments:", error);
    res.status(500).json({ error: "Failed to load assignments" });
  }
};

export const createAssignment = async (req, res) => {
  try {
    const { title, course, due, points, status } = req.body;
    
    if (!title || !course || !due) {
      return res.status(400).json({ error: "Title, course and due date are required" });
    }

    const newAssignment = await Assignment.create({
      userId: req.user._id,
      title,
      course,
      due,
      points: Number(points) || 0,
      status: status || 'todo'
    });

    res.status(201).json({ ...newAssignment.toObject(), id: newAssignment._id });
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({ error: "Failed to save assignment" });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const id = req.params.id;
    const { title, course, due, points, status } = req.body;

    const assignment = await Assignment.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { title, course, due, points, status },
      { returnDocument: 'after' }
    );

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    res.json({ ...assignment.toObject(), id: assignment._id });
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ error: "Failed to update assignment" });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await Assignment.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!result) return res.status(404).json({ error: "Assignment not found" });
    res.json({ message: "Assignment deleted" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
};
