import Attendance from "../models/Attendance.js";

export const getAttendance = async (req, res) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.subjectId) filter.subjectId = req.query.subjectId;
    if (req.query.date) filter.date = req.query.date;
    
    const records = await Attendance.find(filter);
    res.json(records);
  } catch (error) {
    console.error("Error reading attendance:", error);
    res.status(500).json({ error: "Failed to load attendance" });
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { subjectId, subjectName, date, status } = req.body;
    
    if (!subjectId || !subjectName || !date || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const validStatuses = ["present", "absent", "late", "unmarked"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const record = await Attendance.findOneAndUpdate(
      { userId: req.user._id, subjectId, date },
      { subjectName, status },
      { returnDocument: 'after', upsert: true }
    );

    res.status(200).json(record);
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
};
