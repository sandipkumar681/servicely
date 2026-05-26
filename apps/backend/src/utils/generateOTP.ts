import { maxValueOfOtp, minValueOfOtp } from "../constants";

export const generateOTP = () => {
  const otp =
    Math.floor(Math.random() * (maxValueOfOtp - minValueOfOtp + 1)) +
    minValueOfOtp;
  return otp.toString();
};
