import { Model } from "mongoose";

export interface IOtp {
  email: string;
  emailOtp: string;
  phone: string;
  phoneOtp: string;
  createdAt: Date;
}

export interface IOtpModel extends Model<IOtp> {}
