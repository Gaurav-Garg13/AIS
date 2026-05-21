import User from "../models/User.js";
import Profile from "../models/Profile.js";
import Stat from "../models/Stat.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { getFullAvatarUrl } from "../utils/avatar.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "default_secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please provide name, email, and password" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
    });

    await Profile.create({ userId: user._id });
    await Stat.create({ userId: user._id });

    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: getFullAvatarUrl(req, user.avatarUrl),
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error during signup" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: getFullAvatarUrl(req, user.avatarUrl),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;
    
    let user = await User.findOne({ email });
    
    if (!user) {
      user = await User.create({
        name,
        email,
        googleId: sub,
        authProvider: "google",
        avatarUrl: picture,
      });
      await Profile.create({ userId: user._id });
      await Stat.create({ userId: user._id });
    } else if (!user.googleId) {
      user.googleId = sub;
      if (picture && !user.avatarUrl) {
        user.avatarUrl = picture;
      }
      await user.save();
    }
    
    const jwtToken = generateToken(user._id);
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: getFullAvatarUrl(req, user.avatarUrl),
      token: jwtToken,
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Failed to authenticate with Google" });
  }
};

export const getMe = async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.user._id });
    const userObj = req.user.toObject();
    userObj.avatarUrl = getFullAvatarUrl(req, userObj.avatarUrl);
    res.json({
      user: userObj,
      profile,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
