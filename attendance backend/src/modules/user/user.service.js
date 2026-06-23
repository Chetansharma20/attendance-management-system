import bcrypt from "bcryptjs";
import User from "../../models/users.js";
import Attendance from "../../models/attendance.js";
import { ApiError } from "../../utils/ApiError.js";

export const registerUser = async ({ name, email, password, role = "employee", managerId, shiftId }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    managerId: role === "employee" ? managerId : null,
    shiftId: shiftId || null,
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    managerId: user.managerId,
    shiftId: user.shiftId,
  };
};

export const getUsersExceptAdmin = async (roleFilter, page = 1, limit = 10) => {
  const query = { role: { $ne: "admin" } };

  if (roleFilter && roleFilter !== "all") {
    query.role = roleFilter;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query).select("-password").populate("shiftId").skip(skip).limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export const getMyTeamService = async (managerId) => {
  const employees = await User.find({ managerId, role: "employee" }).select("-password");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const employeeIds = employees.map((e) => e._id);
  const todayAttendances = await Attendance.find({
    employeeId: { $in: employeeIds },
    date: { $gte: startOfDay, $lte: endOfDay },
  }).select("employeeId punches");

  const attendanceMap = {};
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
