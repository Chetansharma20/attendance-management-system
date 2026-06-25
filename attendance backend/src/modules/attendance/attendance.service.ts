import { findUserByIdWithShift, findTeamEmployees } from "../user/user.repository.js";
import Overtime from "../overtime/overtime.js";
import Settings from "../settings/settings.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  getTodayRange,
  validateGeofence,
  getUserBreakPolicy,
  calculateWorkingHours,
} from "../../utils/attendanceHelpers.js";
import {
  findAttendanceForDateRange,
  createAttendance,
  findAttendanceById,
  findAttendanceByQuery,
  findAttendanceWithPagination,
  countAttendance,
} from "./attendance.repository.js";

export const punchInService = async (userId: string, latitude: number, longitude: number, selfieUrl?: string) => {
  const settings = await Settings.findOne();
  validateGeofence(settings, latitude, longitude, "Clock-in");

  const { start, end } = getTodayRange();
  let attendance = await findAttendanceForDateRange(userId, start, end);

  const newPunch = { type: "in" as const, time: new Date(), selfieUrl, location: { latitude, longitude } };

  const user = await findUserByIdWithShift(userId);
  const assignedShift = user?.shiftId as any;

  let arrivalStatus = "on-time";
  const startTime = assignedShift ? assignedShift.startTime : (settings?.workStartTime || "09:00");
  const graceMin = assignedShift ? assignedShift.gracePeriod : (settings?.gracePeriod || 15);

  if (startTime) {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const punchTime = new Date();
    const shiftStart = new Date(punchTime);
    shiftStart.setHours(startHour, startMinute, 0, 0);
    const cutoffTime = new Date(shiftStart.getTime() + graceMin * 60 * 1000);
    if (punchTime > cutoffTime) arrivalStatus = "late";
  }

  if (!attendance) {
    attendance = await createAttendance({
      employeeId: userId,
      date: new Date(),
      punches: [newPunch],
      arrivalStatus,
      completionStatus: "incomplete",
    });
  } else {
    const lastPunch = attendance.punches[attendance.punches.length - 1];
    if (lastPunch) {
      if (lastPunch.type === "in") {
        throw new ApiError(400, "You are already punched in. Please punch out first.");
      }
      if (lastPunch.type === "out") {
        throw new ApiError(400, "You have already completed your punch in and punch out for today.");
      }
    }
    attendance.punches.push(newPunch);
    attendance.completionStatus = "incomplete";
    await attendance.save();
  }

  return attendance;
};

export const punchOutService = async (userId: string, latitude: number, longitude: number, selfieUrl?: string) => {
  const settings = await Settings.findOne();
  validateGeofence(settings, latitude, longitude, "Clock-out");

  const { start, end } = getTodayRange();
  const attendance = await findAttendanceForDateRange(userId, start, end);

  if (!attendance || attendance.punches.length === 0) {
    throw new ApiError(404, "No punch in found for today");
  }

  const lastPunch = attendance.punches[attendance.punches.length - 1];
  if (lastPunch.type === "out") {
    throw new ApiError(400, "You are already punched out. Please punch in first.");
  }

  const newPunch = { type: "out" as const, time: new Date(), selfieUrl, location: { latitude, longitude } };
  attendance.punches.push(newPunch);

  const user = await findUserByIdWithShift(userId);
  const assignedShift = user?.shiftId as any;

  let departureStatus = "regular";
  const endTime = assignedShift ? assignedShift.endTime : (settings?.workEndTime || "18:00");

  if (endTime) {
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const punchTime = new Date();
    const shiftEnd = new Date(punchTime);
    shiftEnd.setHours(endHour, endMinute, 0, 0);
    if (punchTime < shiftEnd) departureStatus = "early-departure";
  }

  attendance.departureStatus = departureStatus as any;

  // Auto-end any active break at the time of punch out
  if (attendance.breaks && attendance.breaks.length > 0) {
    const activeBreak = attendance.breaks.find(b => !b.endTime);
    if (activeBreak) {
      activeBreak.endTime = new Date();
    }
  }

  const workingHours = calculateWorkingHours(attendance.punches, attendance.breaks);
  attendance.workingHours = workingHours;
  attendance.completionStatus = workingHours >= 8 ? "completed" : "incomplete";

  await attendance.save();
  return attendance;
};

export const getMyAttendanceService = async (userId: string, date?: string) => {
  const query: any = { employeeId: userId };
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  }
  const attendances = await findAttendanceByQuery(query);

  const attendanceIds = attendances.map((a) => a._id);
  const overtimes = await Overtime.find({ attendanceId: { $in: attendanceIds } });
  const overtimeMap: any = {};
  overtimes.forEach((ot) => { overtimeMap[ot.attendanceId.toString()] = ot; });

  return attendances.map((a) => {
    const obj = a.toObject();
    obj.overtimeRequest = overtimeMap[a._id.toString()] || null;
    return obj;
  });
};

export const getAttendanceByEmployeeIdService = async (employeeId: string) => {
  const attendances = await findAttendanceByQuery({ employeeId });
  if (!attendances.length) throw new ApiError(404, "No attendance records found");
  return attendances;
};

export const getTeamAttendanceService = async (managerId: string) => {
  const employees = await findTeamEmployees(managerId);
  if (!employees.length) throw new ApiError(404, "No team members found");

  const employeeIds = employees.map((emp: any) => emp._id);
  const attendances = await findAttendanceByQuery({ employeeId: { $in: employeeIds } });

  const attendanceIds = attendances.map((a) => a._id);
  const overtimes = await Overtime.find({ attendanceId: { $in: attendanceIds } });
  const overtimeMap: any = {};
  overtimes.forEach((ot) => { overtimeMap[ot.attendanceId.toString()] = ot; });

  return attendances.map((a) => {
    const obj = a.toObject();
    obj.overtimeRequest = overtimeMap[a._id.toString()] || null;
    return obj;
  });
};

export const getAllAttendanceService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [attendances, total] = await Promise.all([
    findAttendanceWithPagination({}, skip, limit),
    countAttendance(),
  ]);

  const attendanceIds = attendances.map((a) => a._id);
  const overtimes = await Overtime.find({ attendanceId: { $in: attendanceIds } });
  const overtimeMap: any = {};
  overtimes.forEach((ot) => { overtimeMap[ot.attendanceId.toString()] = ot; });

  return {
    attendances: attendances.map((a) => {
      const obj = a.toObject();
      obj.overtimeRequest = overtimeMap[a._id.toString()] || null;
      return obj;
    }),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const startBreakService = async (userId: string, breakType: "tea" | "lunch" | "dinner") => {
  const { start, end } = getTodayRange();

  const attendance = await findAttendanceForDateRange(userId, start, end);
  if (!attendance || attendance.punches.length === 0) {
    throw new ApiError(404, "No clock-in found for today. You must clock in before taking a break.");
  }

  const lastPunch = attendance.punches[attendance.punches.length - 1];
  if (lastPunch.type === "out") {
    throw new ApiError(400, "You are already clocked out for today.");
  }

  // Check if there is an active break already
  const activeBreak = attendance.breaks.find(b => !b.endTime);
  if (activeBreak) {
    throw new ApiError(400, `You are already on a ${activeBreak.type} break.`);
  }

  // Get user's shift break policy
  const user = await findUserByIdWithShift(userId);
  const breakPolicy = getUserBreakPolicy(user);

  // Validate policy
  if (breakType === "lunch" && !breakPolicy.lunch?.enabled) {
    throw new ApiError(400, "Lunch break is not allowed for your shift.");
  }
  if (breakType === "dinner" && !breakPolicy.dinner?.enabled) {
    throw new ApiError(400, "Dinner break is not allowed for your shift.");
  }
  if (breakType === "tea") {
    const maxTeaCount = breakPolicy.tea?.maxCount ?? 2;
    const takenTeaCount = attendance.breaks.filter(b => b.type === "tea").length;
    if (takenTeaCount >= maxTeaCount) {
      throw new ApiError(400, `You have reached the maximum allowed tea breaks (${maxTeaCount}) for your shift.`);
    }
  }

  // Add the break
  attendance.breaks.push({
    type: breakType,
    startTime: new Date()
  });

  await attendance.save();
  return attendance;
};

export const endBreakService = async (userId: string) => {
  const { start, end } = getTodayRange();

  const attendance = await findAttendanceForDateRange(userId, start, end);
  if (!attendance || attendance.punches.length === 0) {
    throw new ApiError(404, "No attendance record found for today.");
  }

  const activeBreak = attendance.breaks.find(b => !b.endTime);
  if (!activeBreak) {
    throw new ApiError(400, "No active break found to end.");
  }

  activeBreak.endTime = new Date();
  await attendance.save();
  return attendance;
};
