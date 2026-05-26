import { Request, Response } from "express";
import { AsyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { Service } from "../models/service.models";

export const getActiveServices = AsyncHandler(async (_req: Request, res: Response) => {
  const services = await Service.find({ isActive: true });
  return res
    .status(200)
    .json(new ApiResponse(200, services, "Active services retrieved successfully"));
});
