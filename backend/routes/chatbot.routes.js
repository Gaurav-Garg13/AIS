import express from "express";
const router = express.Router();
import { generateResponse } from "../controllers/chatbot.controller.js";

router.post("/", generateResponse);

export default router;
