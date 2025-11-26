import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string(),
  number: z.string(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
