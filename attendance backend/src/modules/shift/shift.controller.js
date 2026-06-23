import Shift from "../../models/shift.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export const createShift = asyncHandler(async (req, res) => {
  const { name, startTime, endTime, gracePeriod } = req.body;
  if (!name || !startTime || !endTime) throw new ApiError(400, "Shift name, start time, and end time are required");
  const existingShift = await Shift.findOne({ name });
  if (existingShift) throw new ApiError(400, "Shift with this name already exists");
  const shift = await Shift.create({ name, startTime, endTime, gracePeriod: gracePeriod !== undefined ? Number(gracePeriod) : 15 });
  res.status(201).json(new ApiResponse(201, shift, "Shift created successfully"));
});

export const getAllShifts = asyncHandler(async (req, res) => {
  const shifts = await Shift.find().sort({ name: 1 });
  res.status(200).json(new ApiResponse(200, shifts, "Shifts fetched successfully"));
});

export const deleteShift = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const shift = await Shift.findByIdAndDelete(id);
  if (!shift) throw new ApiError(404, "Shift not found");
  res.status(200).json(new ApiResponse(200, null, "Shift deleted successfully"));
});
