import express from "express";
const router = express.Router();
import { getAssignments, updateAssignment } from "../controllers/assignments.controller.js";

router.get("/", getAssignments);
router.patch("/:id", updateAssignment);

export default router;
