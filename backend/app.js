import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import statsRoutes from "./routes/stats.routes.js";
import coursesRoutes from "./routes/courses.routes.js";
import assignmentsRoutes from "./routes/assignments.routes.js";
import gradesRoutes from "./routes/grades.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import sessionsRoutes from "./routes/sessions.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import deadlinesRoutes from "./routes/deadlines.routes.js";
import scheduleRoutes from "./routes/schedule.routes.js";
import authRoutes from "./routes/auth.routes.js";
import notesRoutes from "./routes/notes.routes.js";
import { requireAuth } from "./middleware/auth.middleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/stats", requireAuth, statsRoutes);
app.use("/api/courses", requireAuth, coursesRoutes);
app.use("/api/assignments", requireAuth, assignmentsRoutes);
app.use("/api/grades", requireAuth, gradesRoutes);
app.use("/api/profile", profileRoutes); // profileRoutes has requireAuth internally for some, wait, let's just use it internally or here. Since profileRoutes has requireAuth internally, we'll keep it as is.
app.use("/api/sessions", requireAuth, sessionsRoutes);
app.use("/api/attendance", requireAuth, attendanceRoutes);
app.use("/api/deadlines", requireAuth, deadlinesRoutes);
app.use("/api/schedule", requireAuth, scheduleRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notes", requireAuth, notesRoutes);

app.use(express.static(path.join(__dirname, "../frontend/public")));
app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});

export default app;
