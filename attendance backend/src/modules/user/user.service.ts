import bcrypt from "bcryptjs";
import { ApiError } from "../../utils/ApiError.js";
import Attendance from "../attendance/attendance.js";
import {
  findUserByEmail,
  createUser,
  findUsersExceptAdmin,
  countUsers,
  findTeamEmployees,
  findUserWithFullDetails,
} from "./user.repository.js";
import Leave from "../leave/leave.js";
import Overtime from "../overtime/overtime.js";

export const registerUser = async ({ name, email, password, role = "employee", managerId, shiftId, departmentId }: any) => {
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await createUser({
    name,
    email,
    password: hashedPassword,
    role,
    managerId: role === "employee" ? managerId : null,
    shiftId: shiftId || null,
    departmentId: departmentId || null,
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    managerId: user.managerId,
    shiftId: user.shiftId,
    departmentId: user.departmentId,
  };
};

export const getUsersExceptAdmin = async (roleFilter: string | undefined, page = 1, limit = 10) => {
  const query: any = { role: { $ne: "admin" } };

  if (roleFilter && roleFilter !== "all") {
    query.role = roleFilter;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    findUsersExceptAdmin(query, skip, limit),
    countUsers(query),
  ]);

  return {
    users,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getMyTeamService = async (managerId: string) => {
  const employees = await findTeamEmployees(managerId);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const employeeIds = employees.map((e) => e._id);
  const todayAttendances = await Attendance.find({
    employeeId: { $in: employeeIds },
    date: { $gte: startOfDay, $lte: endOfDay },
  }).select("employeeId punches");

  const attendanceMap: any = {};
  todayAttendances.forEach((att) => {
    attendanceMap[att.employeeId.toString()] = att;
  });

  return employees.map((emp) => {
    const obj = emp.toObject();
    const todayAtt = attendanceMap[emp._id.toString()];
    if (todayAtt && todayAtt.punches && todayAtt.punches.length > 0) {
      obj.lastPunchType = todayAtt.punches[todayAtt.punches.length - 1].type;
    } else {
      obj.lastPunchType = null;
    }
    return obj;
  });
};

export const getUserProfileService = async (targetUserId: string) => {
  const user = await findUserWithFullDetails(targetUserId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  // Fetch current month's attendance records
  const attendanceLogs = await Attendance.find({
    employeeId: targetUserId,
    date: { $gte: startOfMonth, $lte: endOfMonth },
  }).sort({ date: -1 });

  // Compute stats
  const daysPresent = attendanceLogs.length;
  const totalHours = attendanceLogs.reduce((acc, log) => acc + (log.workingHours || 0), 0);
  const lateArrivals = attendanceLogs.filter(log => log.arrivalStatus === "late").length;
  const earlyDepartures = attendanceLogs.filter(log => log.departureStatus === "early-departure").length;

  // Fetch leaves for this month
  const leaves = await Leave.find({
    employeeId: targetUserId,
    startDate: { $gte: startOfMonth, $lte: endOfMonth },
  });

  const approvedLeaveDays = leaves
    .filter(l => l.status === "approved")
    .reduce((acc, l) => acc + (l.totalDays || 0), 0);
  const pendingLeaves = leaves.filter(l => l.status === "pending").length;

  // Fetch overtime for this month
  const overtimeRecords = await Overtime.find({
    employeeId: targetUserId,
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  });

  const approvedOvertimeHours = overtimeRecords
    .filter(o => o.status === "approved")
    .reduce((acc, o) => acc + (o.requestedHours || 0), 0);
  const pendingOvertime = overtimeRecords.filter(o => o.status === "pending").length;

  return {
    user,
    stats: {
      daysPresent,
      totalHours,
      lateArrivals,
      earlyDepartures,
      approvedLeaveDays,
      pendingLeaves,
      approvedOvertimeHours,
      pendingOvertime,
    },
    recentAttendance: attendanceLogs.slice(0, 10),
  };
};

