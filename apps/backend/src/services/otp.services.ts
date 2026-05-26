import { Otp } from "../models/otp.models";
import { IOtp } from "@NursingPracticer/types";
import { ApiError } from "../utils/apiError";

export const saveOtp = async (
  email: string,
  emailOtp: string,
  phone: string,
  phoneOtp: string,
) => {
  try {
    const createdAt = new Date();
    const exists: IOtp | null = await Otp.findOne({ email });

    if (exists) {
      await Otp.findOneAndUpdate({ email }, { emailOtp, phoneOtp, createdAt });
    } else {
      await Otp.create({ email, emailOtp, phone, phoneOtp, createdAt });
    }
  } catch (error) {
    throw new ApiError(500, `❌ Error in saveOtp(): ${error}`);
  }
};

export const verifyOtp = async (
  email: string,
  firstOtp: string,
  secondOtp: string,
) => {
  try {
    const otpInDb = await Otp.findOne({ email });
    return firstOtp === otpInDb?.emailOtp && secondOtp === otpInDb?.phoneOtp;
  } catch (error) {
    throw new ApiError(500, `❌ Error in verifyOtp(): ${error}`);
  }
};
