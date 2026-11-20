const mongoose = require("mongoose");

const { Schema } = mongoose;

const educationSchema = new Schema(
  { institution: String, degree: String, field: String, startDate: String, endDate: String, grade: String, description: String },
  { _id: false }
);
const experienceSchema = new Schema(
  { company: String, position: String, location: String, startDate: String, endDate: String, current: Boolean, description: String },
  { _id: false }
);
const projectSchema = new Schema(
  { name: String, link: String, technologies: String, description: String },
  { _id: false }
);
const certificationSchema = new Schema(
  { name: String, issuer: String, date: String, link: String },
  { _id: false }
);

const resumeSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Untitled Resume", trim: true, maxlength: 120 },
    template: { type: String, enum: ["modern", "classic", "minimal"], default: "modern" },
    personal: {
      fullName: String,
      jobTitle: String,
      email: String,
      phone: String,
      location: String,
      linkedin: String,
      github: String,
      website: String,
      summary: String,
    },
    education: [educationSchema],
    experience: [experienceSchema],
    skills: [String],
    projects: [projectSchema],
    certifications: [certificationSchema],
    lastAtsScore: { type: Number, min: 0, max: 100 },
    lastAnalyzedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
