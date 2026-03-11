import express from "express";
const router = express.Router();
import { getAttendance, markAttendance } from "../controllers/attendance.controller.js";

router.get("/", getAttendance);
router.post("/mark", markAttendance);

export default router;
