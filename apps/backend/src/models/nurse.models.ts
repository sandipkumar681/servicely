import mongoose from "mongoose";

// -----------------------------
// 1. User Document Interface
// -----------------------------
import { INurseDocument } from "@NursingPracticer/types";
// -----------------------------
// 2. User Model Interface
// -----------------------------
import { INurseModel } from "@NursingPracticer/types";
// -----------------------------
// 3. Schema
// -----------------------------
const userSchema = new mongoose.Schema<INurseDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    certificateFile: {
      type: String,
      required: true,
      trim: true,
    },
    available: {
      type: Boolean,
      required: true,
      default: false,
    },
    services: {
      type: [String],
      required: true,
      enum: [
        "Cardiology",
        "Dermatology",
        "Neurology",
        "Orthopedics",
        "Pediatrics",
        "Psychiatry",
        "Urology",
      ],
    },
    location: {
      type: String,
      required: true,
    },
    approved: {
      type: Boolean,
      required: true,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
    versionKey: false,
  },
);

// -----------------------------
// 4. Export
// -----------------------------
export const Nurse = mongoose.model<INurseDocument, INurseModel>(
  "Nurse",
  userSchema,
);
