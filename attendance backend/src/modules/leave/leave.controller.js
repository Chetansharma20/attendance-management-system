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

export const applyLeave = asyncHandler(async (req, res) => {
  const leave = await applyLeaveService(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, leave, "Leave application submitted successfully"));
});

export const getMyLeaves = asyncHandler(async (req, res) => {
  const leaves = await getMyLeavesService(req.user._id);
  res.status(200).json(new ApiResponse(200, leaves, "Your leave history fetched successfully"));
});

export const getMyLeaveBalance = asyncHandler(async (req, res) => {
  const balance = await getMyLeaveBalanceService(req.user._id);
  res.status(200).json(new ApiResponse(200, balance, "Leave balance fetched successfully"));
});

// ─── Manager ─────────────────────────────────────────────────────────────────

export const getTeamLeaves = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const leaves = await getTeamLeavesService(req.user._id, status);
  res.status(200).json(new ApiResponse(200, leaves, "Team leave requests fetched successfully"));
});

// ─── Admin ───────────────────────────────────────────────────────────────────

export const getAllLeaves = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 15;
  const { status } = req.query;
  const data = await getAllLeavesService(page, limit, status);
  res.status(200).json(new ApiResponse(200, data, "All leave requests fetched successfully"));
});

export const getAllLeaveBalances = asyncHandler(async (req, res) => {
  const balances = await getAllLeaveBalancesService();
  res.status(200).json(new ApiResponse(200, balances, "All employee leave balances fetched successfully"));
});

export const getLeaveBalanceById = asyncHandler(async (req, res) => {
  const balance = await getLeaveBalanceByIdService(req.params.employeeId);
  res.status(200).json(new ApiResponse(200, balance, "Leave balance fetched successfully"));
});

export const updateLeaveBalance = asyncHandler(async (req, res) => {
  const balance = await updateLeaveBalanceService(req.params.employeeId, req.body);
  res.status(200).json(new ApiResponse(200, balance, "Leave balance updated successfully"));
});

export const getLeavePolicy = asyncHandler(async (req, res) => {
  const policy = await getLeavePolicyService();
  res.status(200).json(new ApiResponse(200, policy, "Leave policy fetched successfully"));
});

export const updateLeavePolicy = asyncHandler(async (req, res) => {
  const policy = await updateLeavePolicyService(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, policy, "Leave policy updated successfully"));
});

// ─── Shared (Manager + Admin) ────────────────────────────────────────────────

export const updateLeaveStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const leave = await updateLeaveStatusService(
    req.params.leaveId,
    req.user._id,
    req.user.role,
    status,
    rejectionReason
  );
  res.status(200).json(new ApiResponse(200, leave, `Leave request ${status} successfully`));
});
