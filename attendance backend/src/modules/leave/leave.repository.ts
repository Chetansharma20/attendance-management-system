import Leave, { ILeave } from "./leave.js";
import LeaveBalance, { ILeaveBalance } from "./leaveBalance.js";
import LeavePolicy, { ILeavePolicy } from "./leavePolicy.js";

// ─── Leave Policy ───────────────────────────────────────────────────────────
export const findLeavePolicy = async (): Promise<ILeavePolicy | null> => {
  return await LeavePolicy.findOne();
};

export const createLeavePolicy = async (data: Partial<ILeavePolicy>): Promise<ILeavePolicy> => {
  return await LeavePolicy.create(data);
};

// ─── Leave Balance ──────────────────────────────────────────────────────────
export const findLeaveBalance = async (
  employeeId: string,
  year: number
): Promise<ILeaveBalance | null> => {
  return await LeaveBalance.findOne({ employeeId, year });
};

export const createLeaveBalance = async (data: Partial<ILeaveBalance>): Promise<ILeaveBalance> => {
  return await LeaveBalance.create(data);
};

export const findLeaveBalances = async (
  employeeIds: string[],
  year: number
): Promise<ILeaveBalance[]> => {
  return await LeaveBalance.find({ employeeId: { $in: employeeIds }, year });
};

// ─── Leave Requests ─────────────────────────────────────────────────────────
export const findOverlapLeave = async (
  employeeId: string,
  start: Date,
  end: Date
): Promise<ILeave | null> => {
  return await Leave.findOne({
    employeeId,
    status: { $in: ["pending", "approved"] },
    startDate: { $lte: end },
    endDate: { $gte: start },
  });
};

export const createLeaveRequest = async (data: Partial<ILeave>): Promise<ILeave> => {
  return await Leave.create(data);
};

export const findMyLeaves = async (employeeId: string): Promise<ILeave[]> => {
  return await Leave.find({ employeeId })
    .sort({ createdAt: -1 })
    .populate("approvedBy", "name role");
};

export const findLeaves = async (query: any): Promise<ILeave[]> => {
  return await Leave.find(query)
    .sort({ createdAt: -1 })
    .populate("employeeId", "name email")
    .populate("approvedBy", "name role");
};

export const findLeavesWithPagination = async (
  query: any,
  skip: number,
  limit: number
): Promise<ILeave[]> => {
  return await Leave.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("employeeId", "name email")
    .populate("approvedBy", "name role");
};

export const countLeaves = async (query: any): Promise<number> => {
  return await Leave.countDocuments(query);
};

export const findLeaveById = async (id: string): Promise<ILeave | null> => {
  return await Leave.findById(id);
};

export const findLeaveByIdAndPopulateEmployee = async (id: string): Promise<ILeave | null> => {
  return await Leave.findById(id).populate("employeeId");
};

export const findLeaveByIdAndPopulateAll = async (id: string): Promise<ILeave | null> => {
  return await Leave.findById(id)
    .populate("employeeId", "name email")
    .populate("approvedBy", "name role");
};

export const findLeavesInDateRange = async (employeeId: any, start: Date, end: Date): Promise<ILeave[]> => {
  return await Leave.find({ employeeId, startDate: { $lte: end }, endDate: { $gte: start } });
};

export const findApprovedLeavesForEmployeesInDateRange = async (employeeIds: any[], start: Date, end: Date): Promise<ILeave[]> => {
  return await Leave.find({
    employeeId: { $in: employeeIds },
    status: "approved",
    startDate: { $lte: end },
    endDate: { $gte: start }
  });
};

