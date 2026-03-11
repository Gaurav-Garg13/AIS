import express from "express";
const router = express.Router();
import { getStats, updateStat } from "../controllers/stats.controller.js";

router.get("/", getStats);
router.patch("/:label", updateStat);

export default router;
