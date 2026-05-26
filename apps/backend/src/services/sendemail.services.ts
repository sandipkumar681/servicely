import nodemailer from "nodemailer";
import { ENV_VALUE } from "../utils/env";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  port: Number(ENV_VALUE.EMAIL.GMAIL_PORT),
  auth: {
    user: ENV_VALUE.EMAIL.SENDER_GMAIL_ADDRESS,
    pass: ENV_VALUE.EMAIL.SENDER_GMAIL_PASSWORD,
  },
});
