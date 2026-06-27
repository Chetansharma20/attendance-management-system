import { ApiError } from "../../utils/ApiError.js";
import { findUserById, findTeamEmployees, findUsersExceptAdmin } from "../user/user.repository.js";
import { countWeekdays } from "../../utils/attendanceHelpers.js";
import Holiday from "../holiday/holiday.js";
import Notification from "../notification/notification.js";
import { createNotificationService, notifyAdminsService } from "../notification/notification.service.js";
import {
  findLeavePolicy,
  createLeavePolicy,
  findLeaveBalance,
  createLeaveBalance,
  findLeaveBalances,
  findOverlapLeave,
  createLeaveRequest,
  findMyLeaves,
  findLeaves,
  findLeavesWithPagination,
  countLeaves,
  findLeaveByIdAndPopulateEmployee,
  findLeaveByIdAndPopulateAll,
} from "./leave.repository.js";
import LeaveBalance from "./leaveBalance.js";
import LeavePolicy from "./leavePolicy.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Get or auto-create a leave balance record for an employee in a given year.
 * Seeds from the current LeavePolicy defaults.
 */
const getOrCreateBalance = async (employeeId: string, year: number) => {
  let balance = await findLeaveBalance(employeeId, year);
  if (!balance) {
    // Seed from current company policy
    const policy = await getLeavePolicyService();
    balance = await createLeaveBalance({
      employeeId: employeeId as any,
      year,
      sick: policy.sick,
      casual: policy.casual,
      earned: policy.earned,
      sickTotal: policy.sick,
      casualTotal: policy.casual,
      earnedTotal: policy.earned,
    });
  }
  return balance;
};

// ─── Policy ─────────────────────────────────────────────────────────────────

export const getLeavePolicyService = async () => {
  let policy = await findLeavePolicy();
  if (!policy) {
    policy = await createLeavePolicy({ sick: 10, casual: 12, earned: 15 });
  }
  return policy;
};

export const updateLeavePolicyService = async (adminId: string, { sick, casual, earned }: any) => {
  let policy = await findLeavePolicy();
  if (!policy) {
    policy = new LeavePolicy();
  }
  if (sick !== undefined) policy.sick = sick;
  if (casual !== undefined) policy.casual = casual;
  if (earned !== undefined) policy.earned = earned;
  policy.updatedBy = adminId as any;
  await policy.save();
  return policy;
};

// ─── Balance ─────────────────────────────────────────────────────────────────

export const getMyLeaveBalanceService = async (employeeId: string) => {
  const year = new Date().getFullYear();
  return await getOrCreateBalance(employeeId, year);
};

export const getLeaveBalanceByIdService = async (employeeId: string) => {
  const year = new Date().getFullYear();
  return await getOrCreateBalance(employeeId, year);
};

export const updateLeaveBalanceService = async (employeeId: string, { sick, casual, earned }: any) => {
  const year = new Date().getFullYear();
  const balance = await getOrCreateBalance(employeeId, year);

  if (sick !== undefined) { balance.sick = sick; balance.sickTotal = sick; }
  if (casual !== undefined) { balance.casual = casual; balance.casualTotal = casual; }
  if (earned !== undefined) { balance.earned = earned; balance.earnedTotal = earned; }

  await balance.save();
  return balance;
};

// ─── Leave Application ───────────────────────────────────────────────────────

export const applyLeaveService = async (
  employeeId: string,
  { leaveType, startDate, endDate, reason }: any
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (end < start) {
    throw new ApiError(400, "End date cannot be before start date");
  }

  // Count only weekdays, excluding public holidays
  const holidays = await Holiday.find({
    date: { $gte: start, $lte: end },
  });

  let holidayCount = 0;
  holidays.forEach(h => {
    const day = h.date.getDay();
    if (day !== 0 && day !== 6) {
      holidayCount++;
    }
  });

  const totalDays = Math.max(0, countWeekdays(start, end) - holidayCount);
  if (totalDays < 1) {
    throw new ApiError(400, "Leave request must include at least one working day (excluding weekends and public holidays)");
  }

  // Check for overlapping pending/approved leaves
  const overlap = await findOverlapLeave(employeeId, start, end);
  if (overlap) {
    throw new ApiError(400, "You already have a leave request overlapping these dates");
  }

  // Check balance for paid leave types
  if (leaveType !== "unpaid") {
    const year = start.getFullYear();
    const balance = await getOrCreateBalance(employeeId, year);
    if (balance[leaveType] < totalDays) {
      throw new ApiError(
        400,
        `Insufficient ${leaveType} leave balance. Available: ${balance[leaveType]} day(s), Requested: ${totalDays} day(s)`
      );
    }
  }

  const leave = await createLeaveRequest({
    employeeId: employeeId as any,
    leaveType,
    startDate: start,
    endDate: end,
    totalDays,
    reason,
  });

  const employee = await findUserById(employeeId);
  if (employee && employee.managerId) {
    await createNotificationService({
      recipientId: employee.managerId,
      title: "New Leave Request",
      message: `${employee.name} has applied for ${totalDays} day(s) of ${leaveType} leave.`,
      type: "leave_request",
      referenceId: leave._id,
    });
  }

  await notifyAdminsService({
    title: "New Leave Request",
    message: `${employee ? employee.name : "An employee"} has applied for ${totalDays} day(s) of ${leaveType} leave.`,
    type: "leave_request",
    referenceId: leave._id,
  });

  return leave;
};

// ─── Employee Views ──────────────────────────────────────────────────────────

export const getMyLeavesService = async (employeeId: string) => {
  return await findMyLeaves(employeeId);
};

// ─── Manager Views ───────────────────────────────────────────────────────────

export const getTeamLeavesService = async (managerId: string, status?: string) => {
  const employees = await findTeamEmployees(managerId);
  if (!employees.length) return [];

  const employeeIds = employees.map((e) => e._id.toString());
  const query: any = { employeeId: { $in: employeeIds } };
  if (status && status !== "all") query.status = status;

  return await findLeaves(query);
};

// ─── Admin Views ─────────────────────────────────────────────────────────────

export const getAllLeavesService = async (page = 1, limit = 10, status?: string) => {
  const skip = (page - 1) * limit;
  const query: any = {};
  if (status && status !== "all") query.status = status;

  const [leaves, total] = await Promise.all([
    findLeavesWithPagination(query, skip, limit),
    countLeaves(query),
  ]);

  return {
    leaves,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAllLeaveBalancesService = async () => {
  const year = new Date().getFullYear();

  // Get all non-admin users
  const users = await findUsersExceptAdmin({ role: { $ne: "admin" } }, 0, 99999);

  // Fetch all existing balance records for this year
  const userIds = users.map((u) => u._id.toString());
  const balances = await findLeaveBalances(userIds, year);
  const balanceMap: any = {};
  balances.forEach((b) => { balanceMap[b.employeeId.toString()] = b; });

  // Merge: if no balance doc exists yet, show policy defaults
  const policy = await getLeavePolicyService();
  return users.map((user) => {
    const balance = balanceMap[user._id.toString()];
    return {
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      balance: balance
        ? { _id: balance._id, sick: balance.sick, casual: balance.casual, earned: balance.earned, sickTotal: balance.sickTotal, casualTotal: balance.casualTotal, earnedTotal: balance.earnedTotal }
        : { sick: policy.sick, casual: policy.casual, earned: policy.earned, sickTotal: policy.sick, casualTotal: policy.casual, earnedTotal: policy.earned, _id: null },
    };
  });
};

// ─── Status Update (Manager / Admin) ────────────────────────────────────────

export const updateLeaveStatusService = async (
  leaveId: string,
  actorId: string,
  actorRole: string,
  status: "approved" | "rejected",
  rejectionReason?: string
) => {
  if (!["approved", "rejected"].includes(status)) {
    throw new ApiError(400, "Status must be 'approved' or 'rejected'");
  }

  const leave = await findLeaveByIdAndPopulateEmployee(leaveId);
  if (!leave) throw new ApiError(404, "Leave request not found");

  // Role check: managers can only action leaves of their own team
  if (actorRole !== "admin") {
    const employee = leave.employeeId as any;
    if (!employee.managerId || employee.managerId.toString() !== actorId.toString()) {
      throw new ApiError(403, "You are not authorized to action this leave request");
    }
  }

  if (leave.status !== "pending") {
    throw new ApiError(400, "This leave request has already been processed");
  }

  if (status === "rejected") {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new ApiError(400, "Rejection reason is required");
    }
    leave.rejectionReason = rejectionReason.trim();
  }

  if (status === "approved" && leave.leaveType !== "unpaid") {
    // Deduct balance on approval
    const year = new Date(leave.startDate).getFullYear();
    const employee = leave.employeeId as any;
    const balance = await getOrCreateBalance(employee._id.toString(), year);

    if (balance[leave.leaveType] < leave.totalDays) {
      throw new ApiError(
        400,
        `Cannot approve: Employee has insufficient ${leave.leaveType} balance (${balance[leave.leaveType]} day(s) remaining, ${leave.totalDays} required)`
      );
    }

    balance[leave.leaveType] -= leave.totalDays;
    await balance.save();
  }

  leave.status = status;
  leave.approvedBy = actorId as any;
  leave.approvedAt = new Date();
  await leave.save();

  const employee = leave.employeeId as any;
  await createNotificationService({
    recipientId: employee._id,
    title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your request for ${leave.totalDays} day(s) of ${leave.leaveType} leave has been ${status}.`,
    type: "leave_status",
    referenceId: leave._id,
  });

  return await findLeaveByIdAndPopulateAll(leaveId);
};
