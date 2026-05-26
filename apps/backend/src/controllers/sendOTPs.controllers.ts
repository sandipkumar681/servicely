import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { AsyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { generateOTP } from "../utils/generateOTP";
import { saveOtp } from "../services/otp.services";
import { transporter } from "../services/sendemail.services";
import { getEmailTemplates } from "../utils/emailTemplate";
import { ENV_VALUE } from "../utils/env";
import { sendSMS } from "../services/sendsms.services";
import { otpSchemaBody } from "@NursingPracticer/schemas";
import { validateData } from "@NursingPracticer/utils";

const sendOTPs = AsyncHandler(async (req: Request, res: Response) => {
  const data = validateData(otpSchemaBody, req.body);

  const { ToCreateProfile, email, phone } = req.body;

  const emailOtp = generateOTP();
  const phoneOtp = generateOTP();
  await saveOtp(email, emailOtp, phone, phoneOtp);

  const { subject, text, html } = getEmailTemplates(emailOtp, ToCreateProfile);

  await transporter.sendMail({
    from: ENV_VALUE.EMAIL.SENDER_GMAIL_ADDRESS,
    to: email,
    subject,
    text,
    html,
  });

  await sendSMS("+917735939759", `Hello Sandip. Here is your OTP: ${phoneOtp}`);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP sent successfully!"));
});

export { sendOTPs };
