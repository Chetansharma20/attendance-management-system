import Leave from "../../models/leave.js";
import LeaveBalance from "../../models/leaveBalance.js";
import LeavePolicy from "../../models/leavePolicy.js";
import User from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Count weekday (Mon–Fri) days between two dates, inclusive.
 * Saturday (6) and Sunday (0) are excluded.
 */
export const countWeekdays = (startDate, endDate) => {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++; // 0 = Sun, 6 = Sat
    current.setDate(current.getDate() + 1);
  }
  return count;
};

/**
 * Get or auto-create a leave balance record for an employee in a given year.
 * Seeds from the current LeavePolicy defaults.
 */
const getOrCreateBalance = async (employeeId, year) => {
  let balance = await LeaveBalance.findOne({ employeeId, year });
  if (!balance) {
    // Seed from current company policy
    const policy = await getLeavePolicyService();
    balance = await LeaveBalance.create({
      employeeId,
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
  let policy = await LeavePolicy.findOne();
  if (!policy) {
    policy = await LeavePolicy.create({ sick: 10, casual: 12, earned: 15 });
  }
  return policy;
};

export const updateLeavePolicyService = async (adminId, { sick, casual, earned }) => {
  let policy = await LeavePolicy.findOne();
  if (!policy) {
    policy = new LeavePolicy();
  }
  if (sick !== undefined) policy.sick = sick;
  if (casual !== undefined) policy.casual = casual;
  if (earned !== undefined) policy.earned = earned;
  policy.updatedBy = adminId;
  await policy.save();
  return policy;
};

// ─── Balance ─────────────────────────────────────────────────────────────────

export const getMyLeaveBalanceService = async (employeeId) => {
  const year = new Date().getFullYear();
  return await getOrCreateBalance(employeeId, year);
};

export const getLeaveBalanceByIdService = async (employeeId) => {
  const year = new Date().getFullYear();
  return await getOrCreateBalance(employeeId, year);
};

export const updateLeaveBalanceService = async (employeeId, { sick, casual, earned }) => {
  const year = new Date().getFullYear();
  const balance = await getOrCreateBalance(employeeId, year);

  if (sick !== undefined) { balance.sick = sick; balance.sickTotal = sick; }
  if (casual !== undefined) { balance.casual = casual; balance.casualTotal = casual; }
  if (earned !== undefined) { balance.earned = earned; balance.earnedTotal = earned; }

  await balance.save();
  return balance;
};

// ─── Leave Application ───────────────────────────────────────────────────────

export const applyLeaveService = async (employeeId, { leaveType, startDate, endDate, reason }) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (end < start) {
    throw new ApiError(400, "End date cannot be before start date");
  }

  // Count only weekdays
  const totalDays = countWeekdays(start, end);
  if (totalDays < 1) {
    throw new ApiError(400, "Leave request must include at least one working day (Mon–Fri)");
  }

  // Check for overlapping pending/approved leaves
  const overlap = await Leave.findOne({
    employeeId,
    status: { $in: ["pending", "approved"] },
    startDate: { $lte: end },
    endDate: { $gte: start },
  });
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

  const leave = await Leave.create({
    employeeId,
    leaveType,
    startDate: start,
    endDate: end,
    totalDays,
    reason,
  });

  return leave;
};

// ─── Employee Views ──────────────────────────────────────────────────────────

export const getMyLeavesService = async (employeeId) => {
  return await Leave.find({ employeeId })
    .sort({ createdAt: -1 })
    .populate("approvedBy", "name role");
};

// ─── Manager Views ───────────────────────────────────────────────────────────

export const getTeamLeavesService = async (managerId, status) => {
  const employees = await User.find({ managerId, role: "employee" }).select("_id");
  if (!employees.length) return [];

  const employeeIds = employees.map((e) => e._id);
  const query = { employeeId: { $in: employeeIds } };
  if (status && status !== "all") query.status = status;

  return await Leave.find(query)
    .sort({ createdAt: -1 })
    .populate("employeeId", "name email")
    .populate("approvedBy", "name role");
};

// ─── Admin Views ─────────────────────────────────────────────────────────────

export const getAllLeavesService = async (page = 1, limit = 10, status) => {
  const skip = (page - 1) * limit;
  const query = {};
  if (status && status !== "all") query.status = status;

  const [leaves, total] = await Promise.all([
    Leave.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("employeeId", "name email")
      .populate("approvedBy", "name role"),
    Leave.countDocuments(query),
  ]);

  return {
    leaves,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getAllLeaveBalancesService = async () => {
  const year = new Date().getFullYear();

  // Get all non-admin users
  const users = await User.find({ role: { $ne: "admin" } }).select("_id name email role");

  // Fetch all existing balance records for this year
  const userIds = users.map((u) => u._id);
  const balances = await LeaveBalance.find({ employeeId: { $in: userIds }, year });
  const balanceMap = {};
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

export const updateLeaveStatusService = async (leaveId, actorId, actorRole, status, rejectionReason) => {
  if (!["approved", "rejected"].includes(status)) {
    throw new ApiError(400, "Status must be 'approved' or 'rejected'");
  }

  const leave = await Leave.findById(leaveId).populate("employeeId");
  if (!leave) throw new ApiError(404, "Leave request not found");

  // Role check: managers can only action leaves of their own team
  if (actorRole !== "admin") {
    const employee = leave.employeeId;
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
    const balance = await getOrCreateBalance(leave.employeeId._id, year);

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
  leave.approvedBy = actorId;
  leave.approvedAt = new Date();
  await leave.save();

  return await Leave.findById(leaveId).populate("employeeId", "name email").populate("approvedBy", "name role");
};
