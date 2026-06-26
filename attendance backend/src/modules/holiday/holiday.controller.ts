import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import Holiday from "./holiday.js";

export const getAllHolidays = asyncHandler(async (req: Request, res: Response) => {
  const holidays = await Holiday.find().sort({ date: 1 });
  res.status(200).json(new ApiResponse(200, holidays, "Holidays fetched successfully"));
});

export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { name, date, type, description } = req.body;

  if (!name || !date) {
    throw new ApiError(400, "Name and date are required fields");
  }

  // Parse date and reset to start of day for consistency
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }
  parsedDate.setHours(0, 0, 0, 0);

  // Check if holiday already exists on this date
  const existing = await Holiday.findOne({ date: parsedDate });
  if (existing) {
    throw new ApiError(400, "A holiday is already scheduled on this date");
  }

  const holiday = await Holiday.create({
    name,
    date: parsedDate,
    type: type || "public",
    description,
  });

  res.status(201).json(new ApiResponse(201, holiday, "Holiday created successfully"));
});

export const deleteHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const holiday = await Holiday.findById(id);
  if (!holiday) {
    throw new ApiError(404, "Holiday not found");
  }

  await holiday.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Holiday deleted successfully"));
});
