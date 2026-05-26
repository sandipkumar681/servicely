import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV_VALUE } from "../utils/env";

// -----------------------------
// 1. User Document Interface
// -----------------------------
import { IUserDocument } from "@NursingPracticer/types";
// -----------------------------
// 2. User Model Interface
// -----------------------------
import { IUserModel } from "@NursingPracticer/types";
// -----------------------------
// 3. Schema
// -----------------------------
const userSchema = new mongoose.Schema<IUserDocument>(
  {
    firstName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      enum: ["user", "admin", "super_admin"],
    },
    refreshToken: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
    versionKey: false,
  },
);

// -----------------------------
// 4. Pre-save Hook
// -----------------------------
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// -----------------------------
// 5. Instance Methods
// -----------------------------

userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id },
    ENV_VALUE.JWT.ACCESS_TOKEN_SECRET as jwt.Secret,
    {
      expiresIn: (Number(ENV_VALUE.JWT.ACCESS_TOKEN_EXPIRY) *
        60 *
        1000) as jwt.SignOptions["expiresIn"],
    },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    ENV_VALUE.JWT.REFRESH_TOKEN_SECRET as jwt.Secret,
    {
      expiresIn: (Number(ENV_VALUE.JWT.REFRESH_TOKEN_EXPIRY) *
        24 *
        60 *
        60 *
        1000) as jwt.SignOptions["expiresIn"],
    },
  );
};

// -----------------------------
// 6. Export
// -----------------------------
export const User = mongoose.model<IUserDocument, IUserModel>(
  "User",
  userSchema,
);
