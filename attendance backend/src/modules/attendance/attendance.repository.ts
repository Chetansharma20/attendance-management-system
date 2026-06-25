import Attendance, { IAttendance } from "./attendance.js";

export const findAttendanceForDateRange = async (
  employeeId: string,
  start: Date,
  end: Date
): Promise<IAttendance | null> => {
  return await Attendance.findOne({
    employeeId,
    date: { $gte: start, $lte: end },
  });
};

export const createAttendance = async (data: any): Promise<IAttendance> => {
  return await Attendance.create(data);
};

export const findAttendanceById = async (id: string): Promise<IAttendance | null> => {
  return await Attendance.findById(id);
};

export const findAttendanceByQuery = async (query: any): Promise<IAttendance[]> => {
  return await Attendance.find(query)
    .sort({ date: -1 })
    .populate("employeeId", "name email role");
};

export const findAttendanceWithPagination = async (
  query: any,
  skip: number,
  limit: number
): Promise<IAttendance[]> => {
  return await Attendance.find(query)
    .populate("employeeId", "name email role")
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);
};

export const countAttendance = async (query?: any): Promise<number> => {
  return await Attendance.countDocuments(query || {});
};

export const findAttendanceForReport = async (query: any): Promise<IAttendance[]> => {
  return await Attendance.find(query)
    .populate("employeeId", "name email")
    .sort({ date: 1 });
};

export const findAttendanceLogs = async (employeeId: any, start: Date, end: Date): Promise<IAttendance[]> => {
  return await Attendance.find({ employeeId, date: { $gte: start, $lte: end } });
};

export const findAttendanceForEmployeesInDateRange = async (employeeIds: any[], start: Date, end: Date): Promise<IAttendance[]> => {
  return await Attendance.find({ employeeId: { $in: employeeIds }, date: { $gte: start, $lte: end } });
};

