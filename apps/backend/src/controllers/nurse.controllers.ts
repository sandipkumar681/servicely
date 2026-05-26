import mongoose from "mongoose";
import { Request, Response } from "express";
import { AsyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { Nurse } from "../models/nurse.models";

export const getNearbyNurses = AsyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, radius = 10, serviceId } = req.query;

  if (!latitude || !longitude) {
    throw new ApiError(400, "Latitude and longitude are required parameters");
  }

  const radiusInMeters = Number(radius) * 1000;
  const coordinates: [number, number] = [Number(longitude), Number(latitude)];

  // Basic filters: nurse must be approved and available
  const matchQuery: any = {
    approved: true,
    available: true,
  };

  if (serviceId) {
    if (!mongoose.Types.ObjectId.isValid(serviceId as string)) {
      throw new ApiError(400, "Invalid serviceId format");
    }
    matchQuery.services = new mongoose.Types.ObjectId(serviceId as string);
  }

  const nearbyNurses = await Nurse.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: coordinates,
        },
        distanceField: "distance",
        maxDistance: radiusInMeters,
        query: matchQuery,
        spherical: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "userInfo",
      },
    },
    {
      $unwind: "$userInfo",
    },
    {
      $project: {
        "userInfo.password": 0,
        "userInfo.refreshToken": 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, nearbyNurses, "Nearby nurses retrieved successfully"));
});
