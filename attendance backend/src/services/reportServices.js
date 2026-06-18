import Attendance from "../models/attendance.js";
import User from "../models/users.js";

// Helper to format Date query range
const getDateRangeFilter = (dateStr) => {
  if (!dateStr) return {};
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);

  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);

  return { date: { $gte: start, $lte: end } };
};

export const getMyReport = async (userId, query) => {
  const filter = {
    employeeId: userId,
    ...getDateRangeFilter(query.date),
  };

  return await Attendance.find(filter)
    .populate("employeeId", "name email")
    .sort({ date: 1 });
};

export const getTeamReport = async (managerId, query) => {
  const employees = await User.find({ managerId }).select("_id");
  const employeeIds = [...employees.map((emp) => emp._id), managerId];

  const filter = {
    employeeId: { $in: employeeIds },
    ...getDateRangeFilter(query.date),
  };

  return await Attendance.find(filter)
    .populate("employeeId", "name email")
    .sort({ date: 1 });
};

export const getAllReport = async (query) => {
  const filter = {
    ...getDateRangeFilter(query.date),
  };

  if (query.status) {
    if (["valid", "invalid", "pending"].includes(query.status)) {
      filter["validation.status"] = query.status;
    } else {
      filter.completionStatus = query.status;
    }
  }

  return await Attendance.find(filter)
    .populate("employeeId", "name email")
    .sort({ date: 1 });
};

export { generateDailyReportPDF } from "../utils/pdfGenerator.js";
