import { z } from "zod";

export const bookingCreateSchema = z.object({
  serviceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid service ID"),
  scheduledTime: z.string().datetime({ message: "Invalid scheduled time format (ISO datetime required)" }),
  address: z.string().min(5, "Address must be at least 5 characters long"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().optional(),
});

export const bookingStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
});

export const cancelBookingSchema = z.object({
  reason: z.string().min(5, "Cancellation reason must be at least 5 characters long"),
});
