import express from "express";
const router = express.Router();
import { getCourses, createCourse, updateCourse, deleteCourse } from "../controllers/courses.controller.js";

router.get("/", getCourses);
router.post("/", createCourse);
router.patch("/:id", updateCourse);
router.delete("/:id", deleteCourse);

export default router;
