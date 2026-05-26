import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  basePrice: z.number().positive("Base price must be a positive number"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  estimatedDuration: z.number().int().positive("Estimated duration must be a positive integer in minutes"),
  isActive: z.boolean().default(true),
});

export const updateServiceSchema = createServiceSchema.partial();
