import Stat from "../models/Stat.js";

export const getStats = async (req, res) => {
  try {
    let stat = await Stat.findOne({ userId: req.user._id });
    if (!stat) {
      stat = await Stat.create({ userId: req.user._id });
    }
    res.json(stat);
  } catch (error) {
    console.error("Error reading stats:", error);
    res.status(500).json({ error: "Failed to load stats" });
  }
};

export const updateStat = async (req, res) => {
  try {
    const label = req.params.label;
    const { value } = req.body;

    const allowedFields = ["gpa", "credits", "focusHours", "assignmentsDone"];
    const fieldMap = {
      "gpa": "gpa",
      "total credits": "credits",
      "focus hours": "focusHours",
      "assignments done": "assignmentsDone"
    };
    
    const field = fieldMap[label.toLowerCase()] || label;
    
    if (!allowedFields.includes(field)) {
      return res.status(400).json({ error: "Invalid stat label" });
    }

    const stat = await Stat.findOneAndUpdate(
      { userId: req.user._id },
      { [field]: Number(value) },
      { returnDocument: 'after', upsert: true }
    );

    res.json(stat);
  } catch (error) {
    console.error("Error updating stats:", error);
    res.status(500).json({ error: "Failed to update stat" });
  }
};
