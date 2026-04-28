import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    legacyId: { type: String },
    code: { type: String, required: true },
    title: { type: String, required: true },
    instructor: { type: String },
    credits: { type: Number, required: true },
    progress: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    syllabus: [{ type: String }],
    description: { type: String },
    schedule: { type: String },
    intensity: { type: String },
    accent: { type: String },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    duration: { type: String },
    prerequisites: [{ type: String }],
    rating: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active' },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Course", courseSchema);
