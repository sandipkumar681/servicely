import mongoose, { HydratedDocument, Model } from "mongoose";
import { IBooking, BookingStatus } from "@NursingPracticer/types";

export type IBookingDocument = HydratedDocument<IBooking>;
export interface IBookingModel extends Model<IBooking> {}

const bookingSchema = new mongoose.Schema<IBookingDocument>(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
    nurseId: {
      type: mongoose.Schema.Types.ObjectId as any,
      ref: "User",
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId as any,
      ref: "Service",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
      required: true,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
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
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0,
      },
      tax: {
        type: Number,
        required: true,
        min: 0,
      },
      platformFee: {
        type: Number,
        required: true,
        min: 0,
      },
      totalPrice: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    notes: {
      type: String,
      trim: true,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// GeoJSON spatial index
bookingSchema.index({ location: "2dsphere" });

export const Booking = mongoose.model<IBookingDocument, IBookingModel>(
  "Booking",
  bookingSchema,
);
