import mongoose, { Schema } from "mongoose";

/**
 * A saved, job-tailored resume version. Always scoped to a single owner via
 * `userId` (Better-Auth user id); every query must filter on it.
 */
const resumeSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 140 },
    targetJobTitle: { type: String, default: "", trim: true },
    targetCompany: { type: String, default: "", trim: true },
    jobUrl: { type: String, default: "", trim: true },
    jobDescription: { type: String, default: "" },
    jdAnalysis: { type: Schema.Types.Mixed, default: {} },
    content: { type: Schema.Types.Mixed, required: true },
    template: {
      type: String,
      enum: ["ats-classic", "modern-developer", "compact"],
      default: "ats-classic",
    },
    matchScore: { type: Number, default: 0, min: 0, max: 100 },
    matchBreakdown: { type: Schema.Types.Mixed, default: {} },
    missingSkills: { type: [String], default: [] },
  },
  { timestamps: true, minimize: false },
);

resumeSchema.index({ userId: 1, updatedAt: -1 });

const ResumeModel =
  mongoose.models.Resume || mongoose.model("Resume", resumeSchema);

export default ResumeModel;
