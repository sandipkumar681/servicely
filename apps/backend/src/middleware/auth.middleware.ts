import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError";
import { User } from "../models/user.models";
import { ENV_VALUE } from "../utils/env";
import { AuthRequest } from "../types/express";

export const verifyJWT = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (!token) {
      return next(new ApiError(401, "Unauthorized request: Access token not found"));
    }

    const decoded = jwt.verify(
      token,
      ENV_VALUE.JWT.ACCESS_TOKEN_SECRET as jwt.Secret,
    ) as { _id: string };

    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return next(new ApiError(401, "Invalid access token: User not found"));
    }

    req.user = user;
    next();
  } catch (error: any) {
    next(new ApiError(401, error?.message || "Invalid access token"));
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized: User not authenticated"));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access forbidden: Role '${req.user.role}' is not authorized to access this resource`,
        ),
      );
    }

    next();
  };
};
