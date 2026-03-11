import express from "express";
const router = express.Router();
import { getSessions, createSession } from "../controllers/sessions.controller.js";

router.get("/", getSessions);
router.post("/", createSession);

export default router;
