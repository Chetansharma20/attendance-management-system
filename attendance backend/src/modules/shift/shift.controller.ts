import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  findShiftByName,
  createShift as createShiftInRepo,
  findAllShifts,
  deleteShiftById,
} from "./shift.repository.js";

export const createShift = asyncHandler(async (req: Request, res: Response) => {
  const { name, startTime, endTime, gracePeriod } = req.body;
  if (!name || !startTime || !endTime) {
    throw new ApiError(400, "Shift name, start time, and end time are required");
  }

  const existingShift = await findShiftByName(name);
  if (existingShift) {
    throw new ApiError(400, "Shift with this name already exists");
  }

  const shift = await createShiftInRepo({
    name,
    startTime,
    endTime,
    gracePeriod: gracePeriod !== undefined ? Number(gracePeriod) : 15,
  });

  res.status(201).json(new ApiResponse(201, shift, "Shift created successfully"));
});

export const getAllShifts = asyncHandler(async (req: Request, res: Response) => {
  const shifts = await findAllShifts();
  res.status(200).json(new ApiResponse(200, shifts, "Shifts fetched successfully"));
});

export const deleteShift = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const shift = await deleteShiftById(id as string);
  if (!shift) {
    throw new ApiError(404, "Shift not found");
  }
  res.status(200).json(new ApiResponse(200, null, "Shift deleted successfully"));
});
