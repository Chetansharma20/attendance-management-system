import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import {
  applyLeaveService,
  getMyLeavesService,
  getMyLeaveBalanceService,
  getTeamLeavesService,
  getAllLeavesService,
  getAllLeaveBalancesService,
  updateLeaveStatusService,
  getLeaveBalanceByIdService,
  updateLeaveBalanceService,
  getLeavePolicyService,
  updateLeavePolicyService,
} from "./leave.service.js";

// ─── Employee ────────────────────────────────────────────────────────────────

export const applyLeave = asyncHandler(async (req: Request, res: Response) => {
  const leave = await applyLeaveService((req as any).user._id, req.body);
  res.status(201).json(new ApiResponse(201, leave, "Leave application submitted successfully"));
});

export const getMyLeaves = asyncHandler(async (req: Request, res: Response) => {
  const leaves = await getMyLeavesService((req as any).user._id);
  res.status(200).json(new ApiResponse(200, leaves, "Your leave history fetched successfully"));
});

export const getMyLeaveBalance = asyncHandler(async (req: Request, res: Response) => {
  const balance = await getMyLeaveBalanceService((req as any).user._id);
  res.status(200).json(new ApiResponse(200, balance, "Leave balance fetched successfully"));
});

// ─── Manager ─────────────────────────────────────────────────────────────────

export const getTeamLeaves = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;
  const leaves = await getTeamLeavesService((req as any).user._id, status as string);
  res.status(200).json(new ApiResponse(200, leaves, "Team leave requests fetched successfully"));
});

// ─── Admin ───────────────────────────────────────────────────────────────────

export const getAllLeaves = asyncHandler(async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 15;
  const { status } = req.query;
  const data = await getAllLeavesService(page, limit, status as string);
  res.status(200).json(new ApiResponse(200, data, "All leave requests fetched successfully"));
});

export const getAllLeaveBalances = asyncHandler(async (req: Request, res: Response) => {
  const balances = await getAllLeaveBalancesService();
  res.status(200).json(new ApiResponse(200, balances, "All employee leave balances fetched successfully"));
});

export const getLeaveBalanceById = asyncHandler(async (req: Request, res: Response) => {
  const balance = await getLeaveBalanceByIdService(req.params.employeeId as string);
  res.status(200).json(new ApiResponse(200, balance, "Leave balance fetched successfully"));
});

export const updateLeaveBalance = asyncHandler(async (req: Request, res: Response) => {
  const balance = await updateLeaveBalanceService(req.params.employeeId as string, req.body);
  res.status(200).json(new ApiResponse(200, balance, "Leave balance updated successfully"));
});

export const getLeavePolicy = asyncHandler(async (req: Request, res: Response) => {
  const policy = await getLeavePolicyService();
  res.status(200).json(new ApiResponse(200, policy, "Leave policy fetched successfully"));
});

export const updateLeavePolicy = asyncHandler(async (req: Request, res: Response) => {
  const policy = await updateLeavePolicyService((req as any).user._id, req.body);
  res.status(200).json(new ApiResponse(200, policy, "Leave policy updated successfully"));
});

// ─── Shared (Manager + Admin) ────────────────────────────────────────────────

export const updateLeaveStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status, rejectionReason } = req.body;
  const leave = await updateLeaveStatusService(
    req.params.leaveId as string,
    (req as any).user._id,
    (req as any).user.role,
    status,
    rejectionReason
  );
  res.status(200).json(new ApiResponse(200, leave, `Leave request ${status} successfully`));
});
