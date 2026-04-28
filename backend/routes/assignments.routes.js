import express from "express";
const router = express.Router();
import { getAssignments, createAssignment, updateAssignment, deleteAssignment } from "../controllers/assignments.controller.js";

router.get("/", getAssignments);
router.post("/", createAssignment);
router.patch("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

export default router;
