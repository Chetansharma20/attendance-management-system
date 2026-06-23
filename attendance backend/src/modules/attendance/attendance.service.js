import Attendance from "../../models/attendance.js";
import User from "../../models/users.js";
import Overtime from "../../models/overtime.js";
import Settings from "../../models/settings.js";
import { ApiError } from "../../utils/ApiError.js";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

const calculateWorkingHours = (punches) => {
  let totalMs = 0;
  for (let i = 0; i < punches.length - 1; i += 2) {
    const punchIn = punches[i];
    const punchOut = punches[i + 1];
    if (punchIn.type === "in" && punchOut && punchOut.type === "out") {
      totalMs += new Date(punchOut.time) - new Date(punchIn.time);
    }
  }
  return Number((totalMs / (1000 * 60 * 60)).toFixed(2));
};

export const punchInService = async (userId, latitude, longitude, selfieUrl) => {
  const settings = await Settings.findOne();
  if (settings && settings.geofenceEnabled) {
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      throw new ApiError(400, "Location coordinates are required when geofencing is enabled");
    }
    const distance = calculateDistance(settings.geofenceLatitude, settings.geofenceLongitude, latitude, longitude);
    if (distance > settings.geofenceRadius) {
      throw new ApiError(400, `Clock-in blocked: You are outside the allowed geofence boundary (Distance: ${distance.toFixed(1)}m, Limit: ${settings.geofenceRadius}m)`);
    }
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  let attendance = await Attendance.findOne({ employeeId: userId, date: { $gte: startOfDay, $lte: endOfDay } });

  const newPunch = { type: "in", time: new Date(), selfieUrl, location: { latitude, longitude } };

  const user = await User.findById(userId).populate("shiftId");
  const assignedShift = user?.shiftId;

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
    attendance = await Attendance.create({
      employeeId: userId,
      date: new Date(),
      punches: [newPunch],
      arrivalStatus,
      completionStatus: "incomplete",
    });
  } else {
    const lastPunch = attendance.punches[attendance.punches.length - 1];
    if (lastPunch && lastPunch.type === "in") {
      throw new ApiError(400, "You are already punched in. Please punch out first.");
    }
    attendance.punches.push(newPunch);
    attendance.completionStatus = "incomplete";
    await attendance.save();
  }

  return attendance;
};

export const punchOutService = async (userId, latitude, longitude, selfieUrl) => {
  const settings = await Settings.findOne();
  if (settings && settings.geofenceEnabled) {
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      throw new ApiError(400, "Location coordinates are required when geofencing is enabled");
    }
    const distance = calculateDistance(settings.geofenceLatitude, settings.geofenceLongitude, latitude, longitude);
    if (distance > settings.geofenceRadius) {
      throw new ApiError(400, `Clock-out blocked: You are outside the allowed geofence boundary (Distance: ${distance.toFixed(1)}m, Limit: ${settings.geofenceRadius}m)`);
    }
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const attendance = await Attendance.findOne({ employeeId: userId, date: { $gte: startOfDay, $lte: endOfDay } });

  if (!attendance || attendance.punches.length === 0) {
    throw new ApiError(404, "No punch in found for today");
  }

  const lastPunch = attendance.punches[attendance.punches.length - 1];
  if (lastPunch.type === "out") {
    throw new ApiError(400, "You are already punched out. Please punch in first.");
  }

  const newPunch = { type: "out", time: new Date(), selfieUrl, location: { latitude, longitude } };
  attendance.punches.push(newPunch);

  const user = await User.findById(userId).populate("shiftId");
  const assignedShift = user?.shiftId;

  let departureStatus = "regular";
  const endTime = assignedShift ? assignedShift.endTime : (settings?.workEndTime || "18:00");

  if (endTime) {
    const [endHour, endMinute] = endTime.split(":").map(Number);
    const punchTime = new Date();
    const shiftEnd = new Date(punchTime);
    shiftEnd.setHours(endHour, endMinute, 0, 0);
    if (punchTime < shiftEnd) departureStatus = "early-departure";
  }

  attendance.departureStatus = departureStatus;
  const workingHours = calculateWorkingHours(attendance.punches);
  attendance.workingHours = workingHours;
  attendance.completionStatus = workingHours >= 8 ? "completed" : "incomplete";

  await attendance.save();
  return attendance;
};

export const getMyAttendanceService = async (userId, date) => {
  const query = { employeeId: userId };
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    query.date = { $gte: start, $lte: end };
  }
  const attendances = await Attendance.find(query).sort({ date: -1 }).populate("employeeId", "name email role");

  const attendanceIds = attendances.map((a) => a._id);
  const overtimes = await Overtime.find({ attendanceId: { $in: attendanceIds } });
  const overtimeMap = {};
  overtimes.forEach((ot) => { overtimeMap[ot.attendanceId.toString()] = ot; });

  return attendances.map((a) => {
    const obj = a.toObject();
    obj.overtimeRequest = overtimeMap[a._id.toString()] || null;
    return obj;
  });
};

export const getAttendanceByEmployeeIdService = async (employeeId) => {
  const attendances = await Attendance.find({ employeeId }).populate("employeeId", "name email role").sort({ date: -1 });
  if (!attendances.length) throw new ApiError(404, "No attendance records found");
  return attendances;
};

export const getTeamAttendanceService = async (managerId) => {
  const employees = await User.find({ managerId, role: "employee" });
  if (!employees.length) throw new ApiError(404, "No team members found");

  const employeeIds = employees.map((emp) => emp._id);
  const attendances = await Attendance.find({ employeeId: { $in: employeeIds } })
    .populate("employeeId", "name email")
    .sort({ date: -1 });

  const attendanceIds = attendances.map((a) => a._id);
  const overtimes = await Overtime.find({ attendanceId: { $in: attendanceIds } });
  const overtimeMap = {};
  overtimes.forEach((ot) => { overtimeMap[ot.attendanceId.toString()] = ot; });

  return attendances.map((a) => {
    const obj = a.toObject();
    obj.overtimeRequest = overtimeMap[a._id.toString()] || null;
    return obj;
  });
};

export const managerPunchService = async (managerId, managerRole, employeeId, type) => {
  const employee = await User.findById(employeeId);
  if (!employee || employee.role !== "employee") throw new ApiError(404, "Employee not found");

  if (managerRole !== "admin") {
    if (!employee.managerId || employee.managerId.toString() !== managerId.toString()) {
      throw new ApiError(403, "You are not authorized to mark attendance for this employee");
    }
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const settings = await Settings.findOne();
  const now = new Date();
  const newPunch = { type, time: now, selfieUrl: "MANAGER_MANUAL_PUNCH", location: { latitude: 0, longitude: 0 } };

  let attendance = await Attendance.findOne({ employeeId, date: { $gte: startOfDay, $lte: endOfDay } });

  if (type === "in") {
    const employeeWithShift = await User.findById(employeeId).populate("shiftId");
    const assignedShift = employeeWithShift?.shiftId;
    let arrivalStatus = "on-time";
    const startTime = assignedShift ? assignedShift.startTime : (settings?.workStartTime || "09:00");
    const graceMin = assignedShift ? assignedShift.gracePeriod : (settings?.gracePeriod || 15);

    if (startTime) {
      const [startHour, startMinute] = startTime.split(":").map(Number);
      const shiftStart = new Date(now);
      shiftStart.setHours(startHour, startMinute, 0, 0);
      const cutoffTime = new Date(shiftStart.getTime() + graceMin * 60 * 1000);
      if (now > cutoffTime) arrivalStatus = "late";
    }

    if (!attendance) {
      attendance = await Attendance.create({
        employeeId, date: now, punches: [newPunch], arrivalStatus,
        completionStatus: "incomplete",
        validation: { status: "pending", remarks: "Manually clocked in by manager — awaiting admin review" },
      });
    } else {
      const lastPunch = attendance.punches[attendance.punches.length - 1];
      if (lastPunch && lastPunch.type === "in") throw new ApiError(400, "Employee is already clocked in. Please clock out first.");
      attendance.punches.push(newPunch);
      attendance.completionStatus = "incomplete";
      attendance.validation = { status: "pending", remarks: "Manually clocked in by manager — awaiting admin review" };
      await attendance.save();
    }
  } else {
    if (!attendance || attendance.punches.length === 0) throw new ApiError(404, "No clock-in found for this employee today");
    const lastPunch = attendance.punches[attendance.punches.length - 1];
    if (lastPunch.type === "out") throw new ApiError(400, "Employee is already clocked out. Please clock in first.");

    attendance.punches.push(newPunch);

    const employeeWithShift = await User.findById(employeeId).populate("shiftId");
    const assignedShift = employeeWithShift?.shiftId;
    let departureStatus = "regular";
    const endTime = assignedShift ? assignedShift.endTime : (settings?.workEndTime || "18:00");

    if (endTime) {
      const [endHour, endMinute] = endTime.split(":").map(Number);
      const shiftEnd = new Date(now);
      shiftEnd.setHours(endHour, endMinute, 0, 0);
      if (now < shiftEnd) departureStatus = "early-departure";
    }

    attendance.departureStatus = departureStatus;
    const workingHours = calculateWorkingHours(attendance.punches);
    attendance.workingHours = workingHours;
    attendance.completionStatus = workingHours >= 8 ? "completed" : "incomplete";
    attendance.validation = { status: "pending", remarks: "Manually clocked out by manager — awaiting admin review" };
    await attendance.save();
  }

  return attendance;
};

export const getAllAttendanceService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [attendances, total] = await Promise.all([
    Attendance.find().populate("employeeId", "name email role").sort({ date: -1 }).skip(skip).limit(limit),
    Attendance.countDocuments(),
  ]);

  const attendanceIds = attendances.map((a) => a._id);
  const overtimes = await Overtime.find({ attendanceId: { $in: attendanceIds } });
  const overtimeMap = {};
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
