import Attendance from "../../models/attendance.js";
import Overtime from "../../models/overtime.js";
import User from "../../models/users.js";
import { ApiError } from "../../utils/ApiError.js";
import { createNotificationService, notifyAdminsService } from "../notification/notification.service.js";

export const requestOvertimeService = async (employeeId, attendanceId, requestedHours, reason) => {
  const attendance = await Attendance.findById(attendanceId);
  if (!attendance) throw new ApiError(404, "Attendance record not found");
  if (attendance.employeeId.toString() !== employeeId.toString()) {
    throw new ApiError(403, "You can only request overtime for your own attendance");
  }
  if (attendance.completionStatus !== "completed") {
    throw new ApiError(400, "Only completed attendance can request overtime");
  }
  const existingRequest = await Overtime.findOne({ attendanceId });
  if (existingRequest) throw new ApiError(400, "Overtime request already exists for this attendance");

  const request = await Overtime.create({ employeeId, attendanceId, requestedHours, reason });

  // Get employee details for the notification message
  const employee = await User.findById(employeeId);

  // Send notification to manager if assigned
  if (employee && employee.managerId) {
    await createNotificationService({
      recipientId: employee.managerId,
      title: "New Overtime Request",
      message: `${employee.name} has requested ${requestedHours} hours of overtime.`,
      type: "overtime_request",
      referenceId: request._id,
    });
  }

  // Notify admins
  await notifyAdminsService({
    title: "New Overtime Request",
    message: `${employee ? employee.name : "An employee"} has requested ${requestedHours} hours of overtime.`,
    type: "overtime_request",
    referenceId: request._id,
  });

  return request;
};

export const getPendingOvertimeService = async (userId, userRole) => {
  let query = { status: "pending" };
  if (userRole !== "admin") {
    const employees = await User.find({ managerId: userId }).select("_id");
    const employeeIds = employees.map((emp) => emp._id);
    if (employeeIds.length === 0) return [];
    query.employeeId = { $in: employeeIds };
  }
  return await Overtime.find(query).populate("employeeId", "name email").sort({ createdAt: -1 });
};

export const updateOvertimeStatusService = async (requestId, userId, userRole, status, rejectionReason) => {
  const allowedStatuses = ["approved", "rejected"];
  if (!allowedStatuses.includes(status)) throw new ApiError(400, "Invalid status. Must be 'approved' or 'rejected'");

  const request = await Overtime.findById(requestId).populate("employeeId");
  if (!request) throw new ApiError(404, "Overtime request not found");

  if (userRole !== "admin" && request.employeeId.managerId.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this request");
  }
  if (request.status !== "pending") throw new ApiError(400, "Request has already been processed");

  request.status = status;
  request.approvedBy = userId;
  request.approvedAt = new Date();
  if (status === "rejected") {
    if (!rejectionReason) throw new ApiError(400, "Rejection reason is required when rejecting a request");
    request.rejectionReason = rejectionReason;
  }

  await request.save();

  // Notify the employee about the approval/rejection status
  await createNotificationService({
    recipientId: request.employeeId._id,
    title: `Overtime Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Your overtime request for ${request.requestedHours} hours has been ${status}.`,
    type: "overtime_status",
    referenceId: request._id,
  });

  return request;
};

export const getMyRequestsService = async (employeeId) => {
  return await Overtime.find({ employeeId }).sort({ createdAt: -1 });
};
