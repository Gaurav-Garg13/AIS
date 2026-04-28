import Schedule from "../models/Schedule.js";

export const getSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.find({ userId: req.user._id });
    res.json(schedule);
  } catch (error) {
    console.error("Error reading schedule:", error);
    res.status(500).json({ error: "Failed to load schedule" });
  }
};

export const createScheduleEntry = async (req, res) => {
  try {
    const { title, day, startTime, endTime, type } = req.body;
    
    if (!title || !day || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newEntry = await Schedule.create({
      userId: req.user._id,
      title,
      day,
      startTime,
      endTime,
      type,
    });

    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error creating schedule entry:", error);
    res.status(500).json({ error: "Failed to create schedule entry" });
  }
};

export const deleteScheduleEntry = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Schedule.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!deleted) {
      return res.status(404).json({ error: "Schedule entry not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting schedule entry:", error);
    res.status(500).json({ error: "Failed to delete schedule entry" });
  }
};
