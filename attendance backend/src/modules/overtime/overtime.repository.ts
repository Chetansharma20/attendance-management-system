import Overtime, { IOvertime } from "./overtime.js";

export const findOvertimeByAttendanceId = async (attendanceId: string): Promise<IOvertime | null> => {
  return await Overtime.findOne({ attendanceId });
};

export const createOvertime = async (data: Partial<IOvertime>): Promise<IOvertime> => {
  return await Overtime.create(data);
};

export const findOvertimes = async (query: any): Promise<IOvertime[]> => {
  return await Overtime.find(query)
    .populate("employeeId", "name email")
    .sort({ createdAt: -1 });
};

export const findOvertimeById = async (id: string): Promise<IOvertime | null> => {
  return await Overtime.findById(id);
};

export const findOvertimeByIdAndPopulateEmployee = async (id: string): Promise<IOvertime | null> => {
  return await Overtime.findById(id).populate("employeeId");
};

export const findOvertimesByEmployeeId = async (employeeId: string): Promise<IOvertime[]> => {
  return await Overtime.find({ employeeId }).sort({ createdAt: -1 });
};

export const findOvertimesInDateRange = async (employeeId: any, start: Date, end: Date): Promise<IOvertime[]> => {
  return await Overtime.find({ employeeId, createdAt: { $gte: start, $lte: end } });
};

