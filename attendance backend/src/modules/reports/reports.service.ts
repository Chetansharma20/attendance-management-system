import {
  findAttendanceForReport,
  findAttendanceLogs,
  findAttendanceForEmployeesInDateRange
} from "../attendance/attendance.repository.js";
import {
  findTeamEmployeeIds,
  findAllUsersForReport,
  findTeamForReport,
  findUserByIdForReport,
  findNonAdminUsers,
  findTeamForTodayStats,
  findUserByIdForTodayStats,
  findUsersInDepartmentForReport
} from "../user/user.repository.js";
import {
  findLeavesInDateRange,
  findApprovedLeavesForEmployeesInDateRange
} from "../leave/leave.repository.js";
import { findOvertimesInDateRange } from "../overtime/overtime.repository.js";

const getDateRangeFilter = (dateStr?: string) => {
  if (!dateStr) return {};
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return { date: { $gte: start, $lte: end } };
};

export const getMyReport = async (userId: string, query: { date?: string }) => {
  const filter = { employeeId: userId, ...getDateRangeFilter(query.date) };
  return await findAttendanceForReport(filter);
};

export const getTeamReport = async (managerId: string, query: { date?: string }) => {
  const employees = await findTeamEmployeeIds(managerId);
  const employeeIds = [...employees.map((emp) => emp._id.toString()), managerId];
  const filter = { employeeId: { $in: employeeIds }, ...getDateRangeFilter(query.date) };
  return await findAttendanceForReport(filter);
};

export const getAllReport = async (query: { date?: string; status?: string }) => {
  const filter: any = { ...getDateRangeFilter(query.date) };
  if (query.status) {
    if (["valid", "invalid", "pending"].includes(query.status)) {
      filter["validation.status"] = query.status;
    } else {
      filter.completionStatus = query.status;
    }
  }
  return await findAttendanceForReport(filter);
};

export const getMonthlyReportDataService = async (userId: string, role: string, monthStr: string, departmentId?: string) => {
  if (!monthStr) {
    throw new Error("Month parameter is required (YYYY-MM)");
  }
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);

  // 1. Determine users in scope
  let users: any[] = [];
  if (role === "admin") {
    if (departmentId) {
      users = await findUsersInDepartmentForReport(departmentId);
    } else {
      users = await findAllUsersForReport();
    }
  } else if (role === "manager") {
    const team = await findTeamForReport(userId);
    const self = await findUserByIdForReport(userId);
    users = [self, ...team].filter(Boolean);
  } else {
    const self = await findUserByIdForReport(userId);
    users = [self].filter(Boolean);
  }

  const reportData = [];

  for (const user of users) {
    // 2. Fetch records
    const attendanceLogs = await findAttendanceLogs(user._id, start, end);
    const leaves = await findLeavesInDateRange(user._id, start, end);
    const overtimes = await findOvertimesInDateRange(user._id, start, end);

    // 3. Aggregate Attendance
    const daysPresent = attendanceLogs.length;
    let totalWorkedHours = 0;
    let lateArrivals = 0;
    let earlyDepartures = 0;
    let totalBreakMinutes = 0;

    attendanceLogs.forEach(log => {
      totalWorkedHours += log.workingHours || 0;
      if (log.arrivalStatus === "late") {
        lateArrivals++;
      }
      if (log.departureStatus === "early-departure") {
        earlyDepartures++;
      }
      
      // Calculate break time
      if (log.breaks && log.breaks.length > 0) {
        log.breaks.forEach(b => {
          if (b.startTime && b.endTime) {
            totalBreakMinutes += (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60);
          }
        });
      }
    });

    // 4. Aggregate Leaves
    const approvedLeaveDays = leaves
      .filter(l => l.status === "approved")
      .reduce((sum, l) => sum + (l.totalDays || 0), 0);
    const pendingLeaveRequests = leaves.filter(l => l.status === "pending").length;

    // 5. Aggregate Overtime
    const approvedOvertimeHours = overtimes
      .filter(o => o.status === "approved")
      .reduce((sum, o) => sum + (o.requestedHours || 0), 0);
    const pendingOvertimeRequests = overtimes.filter(o => o.status === "pending").length;

    reportData.push({
      employee: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId || null
      },
      attendance: {
        daysPresent,
        totalWorkedHours: Number(totalWorkedHours.toFixed(2)),
        averageDailyHours: daysPresent > 0 ? Number((totalWorkedHours / daysPresent).toFixed(2)) : 0,
        lateArrivals,
        earlyDepartures,
        totalBreakMinutes: Math.round(totalBreakMinutes)
      },
      leaves: {
        approvedDays: approvedLeaveDays,
        pendingRequests: pendingLeaveRequests,
        rawList: leaves.map(l => ({
          type: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate,
          status: l.status,
          totalDays: l.totalDays
        }))
      },
      overtime: {
        approvedHours: Number(approvedOvertimeHours.toFixed(2)),
        pendingRequests: pendingOvertimeRequests,
        rawList: overtimes.map(o => ({
          requestedHours: o.requestedHours,
          status: o.status,
          reason: o.reason
        }))
      }
    });
  }

  return reportData;
};

export const generateMonthlyCSVService = (data: any[], departmentName?: string) => {
  const headers = [
    "Department",
    "Employee Name",
    "Email",
    "Role",
    "Days Present",
    "Total Worked Hours",
    "Avg Daily Hours",
    "Late Arrivals",
    "Early Departures",
    "Total Break Minutes",
    "Approved Leave Days",
    "Pending Leave Requests",
    "Approved Overtime Hours",
    "Pending Overtime Requests"
  ];

  const rows = data.map((item) => [
    `"${(departmentName || "All").replace(/"/g, '""')}"`,
    `"${item.employee.name.replace(/"/g, '""')}"`,
    `"${item.employee.email}"`,
    `"${item.employee.role}"`,
    item.attendance.daysPresent,
    item.attendance.totalWorkedHours,
    item.attendance.averageDailyHours,
    item.attendance.lateArrivals,
    item.attendance.earlyDepartures,
    item.attendance.totalBreakMinutes,
    item.leaves.approvedDays,
    item.leaves.pendingRequests,
    item.overtime.approvedHours,
    item.overtime.pendingRequests
  ]);

  return [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
};

export const getTodayStatsService = async (userId: string, role: string, dateStr?: string) => {
  const today = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(today);
  start.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setHours(23, 59, 59, 999);

  let users: any[] = [];
  if (role === "admin") {
    users = await findNonAdminUsers();
  } else if (role === "manager") {
    const team = await findTeamForTodayStats(userId);
    const self = await findUserByIdForTodayStats(userId);
    users = [self, ...team].filter(Boolean);
  } else {
    const self = await findUserByIdForTodayStats(userId);
    users = [self].filter(Boolean);
  }

  const userIds = users.map((u) => u._id);

  // Present today: Have attendance record
  const presentLogs = await findAttendanceForEmployeesInDateRange(userIds, start, end);
  const presentCount = presentLogs.length;

  // On Leave today: Have approved leave spanning today
  const leaveLogs = await findApprovedLeavesForEmployeesInDateRange(userIds, start, end);
  const leaveCount = leaveLogs.length;

  // Late Arrivals today: Present logs with late arrivalStatus
  const lateCount = presentLogs.filter(log => log.arrivalStatus === "late").length;

  const presentUserIds = new Set(presentLogs.map(log => log.employeeId.toString()));
  const leaveUserIds = new Set(leaveLogs.map(log => log.employeeId.toString()));

  const presentEmployees = presentLogs.map(log => {
    const u = users.find(user => user._id.toString() === log.employeeId.toString());
    return {
      _id: log.employeeId,
      name: u?.name || "Unknown",
      email: u?.email || "",
      punchInTime: log.punchIn?.time || null,
      punchOutTime: log.punchOut?.time || null,
      arrivalStatus: log.arrivalStatus || "on-time",
    };
  });

  const onLeaveEmployees = leaveLogs.map(log => {
    const u = users.find(user => user._id.toString() === log.employeeId.toString());
    return {
      _id: log.employeeId,
      name: u?.name || "Unknown",
      email: u?.email || "",
      leaveType: log.leaveType || "General",
      startDate: log.startDate,
      endDate: log.endDate,
    };
  });

  const absentEmployees: any[] = [];
  users.forEach(u => {
    const idStr = u._id.toString();
    if (!presentUserIds.has(idStr) && !leaveUserIds.has(idStr)) {
      absentEmployees.push({
        _id: u._id,
        name: u.name,
        email: u.email,
      });
    }
  });

  return {
    total: users.length,
    present: presentCount,
    onLeave: leaveCount,
    absent: absentEmployees.length,
    late: lateCount,
    presentEmployees,
    onLeaveEmployees,
    absentEmployees
  };
};

export { generateDailyReportPDF, generateMonthlyReportPDF } from "../../utils/pdfGenerator.js";
