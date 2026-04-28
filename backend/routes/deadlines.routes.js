import express from "express";
const router = express.Router();
import { getDeadlines, createDeadline } from "../controllers/deadlines.controller.js";

router.get("/", getDeadlines);
router.post("/", createDeadline);

export default router;
