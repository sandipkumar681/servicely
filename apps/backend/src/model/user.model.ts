import { Schema, model, InferSchemaType } from "mongoose";
import { UserModelType } from "@servicely/types";

const userSchema = new Schema<UserModelType>(
  {
    userName: {
      type: String,
      required: true,
      // unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      // unique: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
    versionKey: false,
  }
);

export type IUser = InferSchemaType<typeof userSchema>;

export const User = model<IUser>("User", userSchema);
