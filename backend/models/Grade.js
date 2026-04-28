import mongoose from "mongoose";

const gradeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: String, required: true },
    code: { type: String, required: true },
    credits: { type: Number, required: true },
    grade: { type: String, required: true },
    points: { type: Number },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Grade", gradeSchema);
