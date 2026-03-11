import express from "express";
const router = express.Router();
import { getSchedule, createScheduleEntry, deleteScheduleEntry } from "../controllers/schedule.controller.js";

router.get("/", getSchedule);
router.post("/", createScheduleEntry);
router.delete("/:id", deleteScheduleEntry);

export default router;
