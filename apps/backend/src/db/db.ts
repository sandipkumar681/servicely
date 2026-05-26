import mongoose, { Mongoose } from "mongoose";
import { DB_NAME } from "../constants";
import { ENV_VALUE } from "../utils/env";

export const connectDB = async (): Promise<Mongoose | void> => {
  try {
    const uri = `${ENV_VALUE.MONGO_URI}/${DB_NAME}`;

    const conn = await mongoose.connect(uri);
    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("🔴 MongoDB connection error:", error);
    process.exit(1);
  }
};
