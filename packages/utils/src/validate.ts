import { z } from "zod";
import { ApiError } from "./apiError";

export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const message = err.issues[0].message;
      throw new ApiError(400, message);
    }
    throw err;
  }
};
