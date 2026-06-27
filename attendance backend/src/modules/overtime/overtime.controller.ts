import { Request, Response } from "express";
import { updateOvertimeStatusService, getPendingOvertimeService, requestOvertimeService, getMyRequestsService, getAllOvertimesService, deleteOvertimeService } from "./overtime.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const requestOvertime = asyncHandler(async (req: Request, res: Response) => {
  const { attendanceId, requestedHours, reason } = req.body;
  const overtime = await requestOvertimeService((req as any).user._id, attendanceId as string, Number(requestedHours), reason as string);
  res.status(201).json(new ApiResponse(201, overtime, "Overtime request submitted successfully"));
});

export const getPendingOvertime = asyncHandler(async (req: Request, res: Response) => {
  const requests = await getPendingOvertimeService((req as any).user._id, (req as any).user.role);
  res.status(200).json(new ApiResponse(200, requests, "Pending overtime requests fetched successfully"));
});

export const updateOvertimeStatus = asyncHandler(async (req: Request, res: Response) => {
  const { requestId, status, rejectionReason } = req.body;
  const result = await updateOvertimeStatusService(requestId as string, (req as any).user._id, (req as any).user.role, status, rejectionReason);
  res.status(200).json(new ApiResponse(200, result, `Overtime request has been ${status} successfully`));
});

export const getMyRequests = asyncHandler(async (req: Request, res: Response) => {
  const result = await getMyRequestsService((req as any).user._id);
  res.status(200).json(new ApiResponse(200, result, "Your overtime requests fetched successfully"));
});

export const getAllOvertimes = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const { status } = req.query;

  const statusStr = typeof status === "string" ? status : undefined;
  const data = await getAllOvertimesService(page, limit, statusStr);
  res.status(200).json(new ApiResponse(200, data, "All overtime requests fetched successfully"));
});

export const deleteOvertime = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await deleteOvertimeService(id as string);
  res.status(200).json(new ApiResponse(200, result, "Overtime request deleted successfully"));
});
