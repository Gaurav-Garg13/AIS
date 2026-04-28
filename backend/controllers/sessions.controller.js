import Session from "../models/Session.js";

export const getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error("Error reading sessions from MongoDB:", error);
    res.status(500).json({ error: "Failed to load sessions" });
  }
};

export const createSession = async (req, res) => {
  try {
    const { subject, minutes } = req.body ?? {};

    if (typeof subject !== "string" || !subject.trim()) {
      return res.status(400).json({ error: "subject is required" });
    }

    const numericMinutes = Number(minutes);
    if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) {
      return res.status(400).json({ error: "minutes must be a positive number" });
    }

    const newSession = await Session.create({
      userId: req.user._id,
      subject: subject.trim(),
      minutes: numericMinutes,
    });

    res.status(201).json(newSession);
  } catch (error) {
    console.error("Error writing session to MongoDB:", error);
    res.status(500).json({ error: "Failed to save session" });
  }
};
