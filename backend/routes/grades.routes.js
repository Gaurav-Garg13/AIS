import express from "express";
const router = express.Router();
import { getGrades, updateGrades, createGrade, updateGrade } from "../controllers/grades.controller.js";

router.get("/", getGrades);
router.put("/", updateGrades);
router.post("/", createGrade);
router.patch("/:code", updateGrade);

export default router;
