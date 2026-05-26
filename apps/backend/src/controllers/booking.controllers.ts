import mongoose from "mongoose";
import { Response } from "express";
import { AsyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { Booking } from "../models/booking.models";
import { Service } from "../models/service.models";
import { Nurse } from "../models/nurse.models";
import { validateData } from "@NursingPracticer/utils";
import { bookingCreateSchema, bookingStatusUpdateSchema, cancelBookingSchema } from "@NursingPracticer/schemas";
import { BookingStatus, SocketEvent } from "@NursingPracticer/types";
import { AuthRequest } from "../types/express";
import { getIO } from "../services/websocket.services";

// 1. Request a Booking (Patient)
export const requestBooking = AsyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  // Validate the body
  const body = validateData(bookingCreateSchema, req.body);

  // Fetch the service details
  const service = await Service.findById(body.serviceId);
  if (!service || !service.isActive) {
    throw new ApiError(404, "Active service not found");
  }

  // Pricing calculations
  const basePrice = service.basePrice;
  const tax = Number((basePrice * 0.18).toFixed(2)); // 18% Tax
  const platformFee = Number((basePrice * 0.05).toFixed(2)); // 5% Platform Fee
  const totalPrice = Number((basePrice + tax + platformFee).toFixed(2));

  // Create the booking record
  const booking = await Booking.create({
    patientId: req.user._id.toString(),
    serviceId: body.serviceId,
    status: BookingStatus.PENDING,
    scheduledTime: new Date(body.scheduledTime),
    address: body.address,
    location: {
      type: "Point",
      coordinates: [body.longitude, body.latitude],
    },
    pricing: {
      basePrice,
      tax,
      platformFee,
      totalPrice,
    },
    notes: body.notes,
  });

  // Find nearby available/approved nurses to notify via WebSockets (within 10 km)
  const maxDistance = 10 * 1000; // 10km in meters
  const nearbyNurses = await Nurse.find({
    approved: true,
    available: true,
    services: body.serviceId,
    location: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [body.longitude, body.latitude],
        },
        $maxDistance: maxDistance,
      },
    },
  } as any);

  // Emit event to nearby nurses rooms
  const io = getIO();
  nearbyNurses.forEach((nurse) => {
    io.to(nurse.user.toString()).emit(SocketEvent.BOOKING_REQUEST, {
      bookingId: booking._id,
      patientName: `${req.user?.firstName} ${req.user?.lastName}`,
      serviceName: service.name,
      scheduledTime: booking.scheduledTime,
      notes: booking.notes,
      totalPrice,
    });
  });

  return res
    .status(201)
    .json(new ApiResponse(201, booking, "Booking request created successfully"));
});

// 2. Update Booking Status (Nurse/Patient)
export const updateBookingStatus = AsyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const { id } = req.params;
  const body = validateData(bookingStatusUpdateSchema, req.body);
  const newStatus = body.status as BookingStatus;

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const currentStatus = booking.status;

  // Validate state transitions
  if (newStatus === BookingStatus.ACCEPTED) {
    if (currentStatus !== BookingStatus.PENDING) {
      throw new ApiError(400, `Cannot accept booking from status: ${currentStatus}`);
    }
    if (req.user.role !== "nurse") {
      throw new ApiError(403, "Only nurses can accept bookings");
    }

    // Assign nurse and transition
    booking.nurseId = req.user._id.toString();
    booking.status = BookingStatus.ACCEPTED;
  } else if (newStatus === BookingStatus.ARRIVED) {
    if (currentStatus !== BookingStatus.ACCEPTED) {
      throw new ApiError(400, `Cannot mark as arrived from status: ${currentStatus}`);
    }
    if (req.user.role !== "nurse" || booking.nurseId?.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Only the assigned nurse can perform this action");
    }
    booking.status = BookingStatus.ARRIVED;
  } else if (newStatus === BookingStatus.IN_PROGRESS) {
    if (currentStatus !== BookingStatus.ARRIVED) {
      throw new ApiError(400, `Cannot start service from status: ${currentStatus}`);
    }
    if (req.user.role !== "nurse" || booking.nurseId?.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Only the assigned nurse can perform this action");
    }
    booking.status = BookingStatus.IN_PROGRESS;
  } else if (newStatus === BookingStatus.COMPLETED) {
    if (currentStatus !== BookingStatus.IN_PROGRESS) {
      throw new ApiError(400, `Cannot complete booking from status: ${currentStatus}`);
    }
    if (req.user.role !== "nurse" || booking.nurseId?.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Only the assigned nurse can perform this action");
    }
    booking.status = BookingStatus.COMPLETED;
  } else {
    throw new ApiError(400, "Invalid status update path. Use cancel endpoint to cancel a booking.");
  }

  await booking.save();

  // Notify both patient and nurse of the status update
  const io = getIO();
  const payload = {
    bookingId: booking._id,
    status: booking.status,
    updatedAt: booking.updatedAt,
  };
  
  io.to(booking.patientId.toString()).emit(SocketEvent.BOOKING_STATUS_CHANGE, payload);
  if (booking.nurseId) {
    io.to(booking.nurseId.toString()).emit(SocketEvent.BOOKING_STATUS_CHANGE, payload);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, booking, `Booking status updated to ${booking.status}`));
});

// 3. Cancel Booking (Patient/Nurse)
export const cancelBooking = AsyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const { id } = req.params;
  const body = validateData(cancelBookingSchema, req.body);

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  const currentStatus = booking.status;
  if (currentStatus === BookingStatus.COMPLETED || currentStatus === BookingStatus.CANCELLED) {
    throw new ApiError(400, `Cannot cancel booking from status: ${currentStatus}`);
  }

  // Authorization check
  const isPatient = booking.patientId.toString() === req.user._id.toString();
  const isNurse = booking.nurseId?.toString() === req.user._id.toString();

  if (!isPatient && !isNurse && req.user.role !== "admin" && req.user.role !== "super_admin") {
    throw new ApiError(403, "You are not authorized to cancel this booking");
  }

  booking.status = BookingStatus.CANCELLED;
  booking.cancellationReason = body.reason;
  await booking.save();

  // Notify other party
  const io = getIO();
  const payload = {
    bookingId: booking._id,
    status: booking.status,
    cancellationReason: booking.cancellationReason,
    updatedAt: booking.updatedAt,
  };

  io.to(booking.patientId.toString()).emit(SocketEvent.BOOKING_STATUS_CHANGE, payload);
  if (booking.nurseId) {
    io.to(booking.nurseId.toString()).emit(SocketEvent.BOOKING_STATUS_CHANGE, payload);
  }

  return res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking cancelled successfully"));
});
