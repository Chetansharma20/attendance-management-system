import { Request, Response } from "express";
import {
  getAllAttendanceService,
  getAttendanceByEmployeeIdService,
  getMyAttendanceService,
  getTeamAttendanceService,
  punchInService,
  punchOutService,
  startBreakService,
  endBreakService,
} from "./attendance.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const punchIn = asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, selfieUrl } = req.body;
  const attendance = await punchInService((req as any).user._id, Number(latitude), Number(longitude), selfieUrl);
  res.status(201).json(new ApiResponse(201, attendance, "Punch in successful"));
});

export const punchOut = asyncHandler(async (req: Request, res: Response) => {
  const { latitude, longitude, selfieUrl } = req.body;
  const attendance = await punchOutService((req as any).user._id, Number(latitude), Number(longitude), selfieUrl);
  res.status(200).json(new ApiResponse(200, attendance, "Punch out successful"));
});

export const getMyAttendance = asyncHandler(async (req: Request, res: Response) => {
  const attendances = await getMyAttendanceService((req as any).user._id, req.query.date as string | undefined);
  res.status(200).json(new ApiResponse(200, attendances, "Attendance fetched successfully"));
});

export const getAttendanceByEmployeeId = asyncHandler(async (req: Request, res: Response) => {
  const attendance = await getAttendanceByEmployeeIdService(req.params.employeeId as string);
  res.status(200).json(new ApiResponse(200, attendance, "Attendance fetched successfully"));
});

export const getTeamAttendance = asyncHandler(async (req: Request, res: Response) => {
  const attendances = await getTeamAttendanceService((req as any).user._id);
  res.status(200).json(new ApiResponse(200, attendances, "Attendance fetched successfully"));
});

export const getAllAttendance = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const data = await getAllAttendanceService(page, limit);
  res.status(200).json(new ApiResponse(200, data, "All attendance records fetched successfully"));
});

export const startBreak = asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.body;
  if (!type || !['tea', 'lunch', 'dinner'].includes(type)) {
    throw new Error("Break type ('tea', 'lunch', or 'dinner') is required");
  }
  const attendance = await startBreakService((req as any).user._id, type as "tea" | "lunch" | "dinner");
  res.status(200).json(new ApiResponse(200, attendance, `${type} break started successfully`));
});

export const endBreak = asyncHandler(async (req: Request, res: Response) => {
  const attendance = await endBreakService((req as any).user._id);
  res.status(200).json(new ApiResponse(200, attendance, "Break ended successfully"));
});
