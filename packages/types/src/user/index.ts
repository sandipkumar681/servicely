import { HydratedDocument, Model } from "mongoose";

export interface IUser {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
  role: string;
  refreshToken: string;
}

export interface IUserMethods {
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

export type IUserDocument = HydratedDocument<IUser, IUserMethods>;
export interface IUserModel extends Model<IUser, {}, IUserMethods> {}
