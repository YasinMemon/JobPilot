import mongoose, { Schema } from "mongoose";

/**
 * Structured resume profile — the only data the resume generator is allowed
 * to draw from. One document per user, keyed by the Better-Auth user id
 * (same id used as `authUserId` on the User model).
 *
 * The payload shape is validated with zod in lib/resume/schemas.ts.
 */
const resumeProfileSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, minimize: false },
);

const ResumeProfileModel =
  mongoose.models.ResumeProfile ||
  mongoose.model("ResumeProfile", resumeProfileSchema);

export default ResumeProfileModel;
