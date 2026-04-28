import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    course: { type: String, required: true },
    due: { type: String, required: true },
    status: { type: String, enum: ["todo", "in_progress", "done"], default: "todo" },
    points: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Assignment", assignmentSchema);
