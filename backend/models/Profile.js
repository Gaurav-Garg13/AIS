import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true, unique: true },
    bio: { type: String, default: "" },
    theme: { type: String, default: "dark" },
    notificationPrefs: {
      emailAssignments: { type: Boolean, default: true },
      emailGrades: { type: Boolean, default: true },
      pushReminders: { type: Boolean, default: false },
      newsletter: { type: Boolean, default: false },
    }
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Profile", profileSchema);
