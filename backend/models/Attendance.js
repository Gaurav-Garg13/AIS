import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subjectId: { type: String, required: true },
    subjectName: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ["present", "absent", "late", "unmarked"], default: "unmarked" },
  },
  { timestamps: true, versionKey: false }
);

attendanceSchema.index({ userId: 1, subjectId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
