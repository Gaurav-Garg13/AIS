import express from "express";
const router = express.Router();
import { getCourses, getCoursesStream, createCourse, updateCourse, deleteCourse } from "../controllers/courses.controller.js";

router.get("/", getCourses);
router.get("/stream", getCoursesStream);
router.post("/", createCourse);
router.patch("/:id", updateCourse);
router.delete("/:id", deleteCourse);

export default router;
