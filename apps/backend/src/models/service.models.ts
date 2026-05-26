import mongoose, { HydratedDocument, Model } from "mongoose";
import { IService } from "@NursingPracticer/types";

export type IServiceDocument = HydratedDocument<IService>;
export interface IServiceModel extends Model<IService> {}

const serviceSchema = new mongoose.Schema<IServiceDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    estimatedDuration: {
      type: Number,
      required: true,
      min: 1, // in minutes
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Service = mongoose.model<IServiceDocument, IServiceModel>(
  "Service",
  serviceSchema,
);
