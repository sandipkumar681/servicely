import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  ToCreateProfile: z.boolean(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  emailOtp: z.string().length(6, "OTP must be exactly 6 characters"),
  phoneOtp: z.string().length(6, "OTP must be exactly 6 characters"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});
