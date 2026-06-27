import { ApiError } from "../../utils/ApiError.js";
import { findAttendanceById } from "../attendance/attendance.repository.js";
import { createNotificationService, notifyAdminsService } from "../notification/notification.service.js";
import Notification from "../notification/notification.js";
import { findUserById, findTeamEmployees } from "../user/user.repository.js";
import {
  findOvertimeByAttendanceId,
  createOvertime,
  findOvertimes,
  findOvertimeByIdAndPopulateEmployee,
  findOvertimesByEmployeeId,
} from "./overtime.repository.js";
import Overtime from "./overtime.js";

export const requestOvertimeService = async (
  employeeId: string,
  attendanceId: string,
  requestedHours: number,
  reason: string
) => {
  const attendance = await findAttendanceById(attendanceId);
  if (!attendance) throw new ApiError(404, "Attendance record not found");
  if (attendance.employeeId.toString() !== employeeId.toString()) {
    throw new ApiError(403, "You can only request overtime for your own attendance");
  }
  if (attendance.completionStatus !== "completed") {
    throw new ApiError(400, "Only completed attendance can request overtime");
  }
  const existingRequest = await findOvertimeByAttendanceId(attendanceId);
  if (existingRequest) {
    throw new ApiError(400, "Overtime request already exists for this attendance");
  }

  const request = await createOvertime({ employeeId: employeeId as any, attendanceId: attendanceId as any, requestedHours, reason });

  const employee = await findUserById(employeeId);

  if (employee && employee.managerId) {
    await createNotificationService({
      recipientId: employee.managerId,
      title: "New Overtime Request",
      message: `${employee.name} has requested ${requestedHours} hours of overtime.`,
      type: "overtime_request",
      referenceId: request._id,
    });
  }

  await notifyAdminsService({
    title: "New Overtime Request",
    message: `${employee ? employee.name : "An employee"} has requested ${requestedHours} hours of overtime.`,
    type: "overtime_request",
    referenceId: request._id,
  });

  return request;
};

export const getPendingOvertimeService = async (userId: string, userRole: string) => {
  const query: any = { status: "pending" };
  if (userRole !== "admin") {
    const employees = await findTeamEmployees(userId);
    const employeeIds = employees.map((emp) => emp._id);
    if (employeeIds.length === 0) return [];
    query.employeeId = { $in: employeeIds };
  }
  return await findOvertimes(query);
};

export const updateOvertimeStatusService = async (
  requestId: string,
  userId: string,
  userRole: string,
  status: "approved" | "rejected",
  rejectionReason?: string
) => {
  const allowedStatuses = ["approved", "rejected"];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(400, "Invalid status. Must be 'approved' or 'rejected'");
  }

  const request = await findOvertimeByIdAndPopulateEmployee(requestId);
  if (!request) throw new ApiError(404, "Overtime request not found");

  const employee = request.employeeId as any;

  if (userRole !== "admin" && employee.managerId.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this request");
  }
  if (request.status !== "pending") throw new ApiError(400, "Request has already been processed");

  request.status = status;
  request.approvedBy = userId as any;
  request.approvedAt = new Date();
  if (status === "rejected") {
    if (!rejectionReason) {
      throw new ApiError(400, "Rejection reason is required when rejecting a request");
    }
    request.rejectionReason = rejectionReason;
  }

  await request.save();

  await createNotificationService({
    recipientId: employee._id,
    title: `Overtime Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your overtime request for ${request.requestedHours} hours has been ${status}.`,
    type: "overtime_status",
    referenceId: request._id,
  });

  // Mark all "overtime_request" notifications for this specific request as read for managers/admins
  await Notification.updateMany(
    { type: "overtime_request", referenceId: request._id },
    { $set: { isRead: true } }
  );

  return request;
};

export const getMyRequestsService = async (employeeId: string) => {
  return await findOvertimesByEmployeeId(employeeId);
};

export const getAllOvertimesService = async (page = 1, limit = 10, status?: string) => {
  const query: any = {};
  if (status && status !== "all") query.status = status;

  const skip = (page - 1) * limit;

  const overtimes = await Overtime.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("employeeId", "name email");

  const total = await Overtime.countDocuments(query);

  return {
    overtimes,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const deleteOvertimeService = async (requestId: string) => {
  const request = await Overtime.findById(requestId);
  if (!request) {
    throw new ApiError(404, "Overtime request not found");
  }

  // Also clean up any pending notifications for this overtime request
  await Notification.deleteMany({ type: "overtime_request", referenceId: request._id });

  await Overtime.findByIdAndDelete(requestId);
  return request;
};
