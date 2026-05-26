import mongoose from "mongoose";
import { INurseDocument, INurseModel } from "@NursingPracticer/types";

const nurseSchema = new mongoose.Schema<INurseDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
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
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    locationText: {
      type: String,
      trim: true,
    },
    approved: {
      type: Boolean,
      required: true,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    strict: "throw",
    versionKey: false,
  },
);

// Create 2dsphere index for location queries
nurseSchema.index({ location: "2dsphere" });

export const Nurse = mongoose.model<INurseDocument, INurseModel>(
  "Nurse",
  nurseSchema,
);
