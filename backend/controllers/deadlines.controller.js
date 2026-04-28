import Deadline from "../models/Deadline.js";

export const getDeadlines = async (req, res) => {
  try {
    const deadlines = await Deadline.find({ userId: req.user._id });
    const formatted = deadlines.map(d => ({ ...d.toObject(), id: d._id }));
    res.json(formatted);
  } catch (error) {
    console.error("Error reading deadlines:", error);
    res.status(500).json({ error: "Failed to load deadlines" });
  }
};

export const createDeadline = async (req, res) => {
  try {
    const { title, subject, dueDate, priority } = req.body;
    
    if (!title || !subject || !dueDate) {
      return res.status(400).json({ error: "Title, subject, and dueDate are required" });
    }

    const newDeadline = await Deadline.create({
      userId: req.user._id,
      title,
      subject,
      dueDate,
      priority: priority || 'medium'
    });

    // Format for frontend
    const formatted = { ...newDeadline.toObject(), id: newDeadline._id };
    res.status(201).json(formatted);
  } catch (error) {
    console.error("Error creating deadline:", error);
    res.status(500).json({ error: "Failed to save deadline" });
  }
};
