import { z } from "zod";

export const registerSchemaBody = z
  .object({
    email: z.string().email(),
    phone: z.string(),
    userEmailOtp: z.string(),
    userPhoneOtp: z.string(),
  })
  .required()
  .strict();

export type RegisterSchemaBody = z.infer<typeof registerSchemaBody>;
