import express from "express";
const router = express.Router();
import { getProfile, updateProfile } from "../controllers/profile.controller.js";

router.get("/", getProfile);
router.patch("/", updateProfile);

export default router;
