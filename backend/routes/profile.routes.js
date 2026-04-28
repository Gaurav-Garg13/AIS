import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { requireAuth } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import Profile from "../models/Profile.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = "public/uploads/avatars";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5000000 },
  fileFilter(req, file, cb) {
    const filetypes = /jpe?g|png|webp|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Images only!"));
    }
  },
});

router.post("/avatar", requireAuth, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatarUrl },
      { new: true }
    ).select("-passwordHash");
    
    res.json({ avatarUrl, user });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");
    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) profile = {};

    res.json({
      name: user.name,
      email: user.email,
      phone: user?.phone || "",
      avatarUrl: user.avatarUrl,
      theme: profile.theme || "dark",
      notificationPrefs: profile.notificationPrefs
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to get profile" });
  }
});

router.patch("/", requireAuth, async (req, res) => {
  try {
    const { name, email, phone, theme, notificationPrefs, avatarUrl } = req.body;
    
    const userUpdates = {};
    if (name) userUpdates.name = name;
    if (email) userUpdates.email = email;
    if (phone !== undefined) userUpdates.phone = phone;
    if (avatarUrl) userUpdates.avatarUrl = avatarUrl;
    
    await User.findByIdAndUpdate(req.user._id, userUpdates);
    
    await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { theme, notificationPrefs },
      { upsert: true, returnDocument: 'after' }
    );
    
    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

export default router;
