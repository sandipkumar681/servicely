import { Response } from "express";
import { AsyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/apiResponse";
import { ApiError } from "../utils/apiError";
import { Nurse } from "../models/nurse.models";
import { User } from "../models/user.models";
import { Service } from "../models/service.models";
import { validateData } from "@NursingPracticer/utils";
import { createServiceSchema, updateServiceSchema } from "@NursingPracticer/schemas";
import { AuthRequest } from "../types/express";

// 1. Approve Nurse Profile
export const approveNurse = AsyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, "User not authenticated");
  }

  const { id } = req.params;

  const nurse = await Nurse.findById(id);
  if (!nurse) {
    throw new ApiError(404, "Nurse profile not found");
  }

  if (nurse.approved) {
    throw new ApiError(400, "Nurse profile is already approved");
  }

  // Update nurse approval state
  nurse.approved = true;
  nurse.approvedBy = req.user._id as any;
  await nurse.save();

  // Ensure user role is updated to "nurse" in the User collection
  await User.findByIdAndUpdate(nurse.user, { role: "nurse" });

  return res
    .status(200)
    .json(new ApiResponse(200, nurse, "Nurse profile approved successfully"));
});

// 2. Fetch Pending Nurses
export const getPendingNurses = AsyncHandler(async (_req: AuthRequest, res: Response) => {
  const pendingNurses = await Nurse.find({ approved: false })
    .populate("user", "-password")
    .populate("services");

  return res
    .status(200)
    .json(new ApiResponse(200, pendingNurses, "Pending nurse profiles retrieved"));
});

// 3. Create Service
export const createService = AsyncHandler(async (req: AuthRequest, res: Response) => {
  const body = validateData(createServiceSchema, req.body);

  const existing = await Service.findOne({ name: body.name.toLowerCase() });
  if (existing) {
    throw new ApiError(400, `Service with name '${body.name}' already exists`);
  }

  const service = await Service.create({
    name: body.name.toLowerCase(),
    basePrice: body.basePrice,
    description: body.description,
    estimatedDuration: body.estimatedDuration,
    isActive: body.isActive,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, service, "Service created successfully"));
});

// 4. Update Service
export const updateService = AsyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const body = validateData(updateServiceSchema, req.body);

  const service = await Service.findById(id);
  if (!service) {
    throw new ApiError(404, "Service not found");
  }

  if (body.name) {
    body.name = body.name.toLowerCase();
    const existing = await Service.findOne({ name: body.name, _id: { $ne: id } });
    if (existing) {
      throw new ApiError(400, `Service with name '${body.name}' already exists`);
    }
  }

  const updatedService = await Service.findByIdAndUpdate(id, body, { new: true });
  return res
    .status(200)
    .json(new ApiResponse(200, updatedService, "Service updated successfully"));
});
