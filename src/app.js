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

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/stats", statsRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/grades", gradesRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/deadlines", deadlinesRoutes);
app.use("/api/schedule", scheduleRoutes);

app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

export default app;
