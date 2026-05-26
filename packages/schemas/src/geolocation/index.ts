import { z } from "zod";

export const locationUpdateSchema = z.object({
  latitude: z.number().min(-90).max(90, "Latitude must be between -90 and 90"),
  longitude: z.number().min(-180).max(180, "Longitude must be between -180 and 180"),
  heading: z.number().min(0).max(360, "Heading must be between 0 and 360").optional(),
});
