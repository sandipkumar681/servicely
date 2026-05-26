import express, { NextFunction, Request, Response } from "express";
// import { MulterError } from "multer";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ENV_VALUE } from "./utils/env";

const app = express();

app.use(
  cors({
    origin: ENV_VALUE.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(cookieParser());

// Routes import
import healthCheckRouter from "./routes/healthcheck.routes";
import userRouter from "./routes/user.routes";
import sendOTPsRouter from "./routes/sendOTPs.routes";
import nurseRouter from "./routes/nurse.routes";
import bookingRouter from "./routes/booking.routes";
import adminRouter from "./routes/admin.routes";
import serviceRouter from "./routes/service.routes";
import { ApiResponse } from "./utils/apiResponse";

// Routes declaration
app.use("/api/v1/healthcheck", healthCheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/otps", sendOTPsRouter);
app.use("/api/v1/nurses", nurseRouter);
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/services", serviceRouter);

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  //   if (err instanceof MulterError) {
  //     if (err.code === "LIMIT_FILE_SIZE") {
  //       return res
  //         .status(400)
  //         .json(new ApiResponse(400, {}, "File is too large"));
  //     }
  //   }

  if (err.statusCode >= 500) {
    console.error(err);
    return res
      .status(500)
      .json(new ApiResponse(500, {}, "Internal Server Error!"));
  }

  return res
    .status(err.statusCode || 500)
    .json(
      new ApiResponse(
        err.statusCode || 500,
        {},
        err.message || "An error occurred",
      ),
    );
});

export default app;
