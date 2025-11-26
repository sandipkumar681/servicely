import mongoose, { ConnectOptions, Mongoose } from "mongoose";

export const connectDB = async (): Promise<Mongoose | void> => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const uri = `${process.env.MONGO_URI}/temporary`;

    const conn = await mongoose.connect(uri);
    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("🔴 MongoDB connection error:", error);
    process.exit(1);
  }
};
