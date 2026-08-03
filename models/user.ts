import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    // email: {
    //   type: String,
    //   required: true,
    //   unique: true,
    // },
    authUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // password: {
    //   type: String,
    //   required: true,
    // },
    currentRole: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    resume: {
      type: String,
      required: false,
    },
    avatar: {
      type: String,
      required: false,
    },
    currentJobTitle: {
      type: String,
      required: false,
    },
    currentCompany: {
      type: String,
      required: false,
    },
    yearsOfExperience: {
      type: String,
      enum: ["Less than 1 year", "1-3", "3-5", "5-10", "10+"],
      required: false,
    },
    currentLocation: {
      type: String,
      required: false,
    },
    skills: {
      type: [String],
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: false,
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    country: {
      type: String,
      required: false,
      default: "India",
    },
    headline: {
      type: String,
      required: false,
    },
    preferredJobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      required: false,
    },
    workMode: {
      type: String,
      enum: ["Remote", "On-site", "Hybrid"],
      required: false,
    },
    noticePeriod: {
      type: String,
      enum: ["Immediate", "15 days", "30 days", "60 days", "90 days"],
      required: false,
    },
    expectedSalary: {
      type: String,
      required: false,
    },
    education: {
      degree: {
        type: String,
        required: false,
      },
      university: {
        type: String,
        required: false,
      },
      passingYear: {
        type: String,
        required: false,
      },
      cgpa: {
        type: String,
        required: false,
      },
    },
    socialLinks: {
      portfolio: {
        type: String,
        required: false,
      },
      github: {
        type: String,
        required: false,
      },
      linkedin: {
        type: String,
        required: false,
      },
    },
  },
  { timestamps: true },
);

const userModel = mongoose.models.User || mongoose.model("User", userSchema);
export default userModel;
