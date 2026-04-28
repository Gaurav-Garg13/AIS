import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    type: { type: String },
  },
  { timestamps: true, versionKey: false }
);

export default mongoose.model("Schedule", scheduleSchema);
