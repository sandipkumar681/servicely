import { z } from "zod";

export const otpSchemaBody = z
  .object({
    ToCreateProfile: z.boolean({
      message: "Please choose whether to create a profile",
    }),
    email: z
      .string({ message: "Email is required" })
      .email("Please enter a valid email address"),
    phone: z.string({ message: "Phone number is required" }),
  })
  .required()
  .strict();
