import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: { type: String },
    googleId: { type: String, index: true },
    authProvider: { type: String, default: "local" },
    avatarUrl: { type: String },
    phone: { type: String },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("User", userSchema);
