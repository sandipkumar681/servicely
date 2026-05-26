import { z } from "zod";

export const nurseVerificationSchema = z.object({
  licenseNumber: z.string().min(5, "License number must be at least 5 characters"),
  certificateFile: z.string().url("Certificate file must be a valid URL"),
  services: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid service ID")),
  location: z.string().min(3, "Location description must be at least 3 characters"),
});
