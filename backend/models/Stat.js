import mongoose from "mongoose";

const statSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true, unique: true },
    gpa: { type: Number, default: 0 },
    credits: { type: Number, default: 0 },
    focusHours: { type: Number, default: 0 },
    assignmentsDone: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Stat", statSchema);
