import { IAttendance } from "./attendance.types.js";
import { ILeave, ILeaveBalance } from "./leave.types.js";

// --- Auth API ---
export interface LoginResponse {
  statusCode: number;
  data: {
    user: {
      _id: string;
      name: string;
      email: string;
      role: "admin" | "manager" | "employee";
      managerId: string | null;
    };
    accessToken: string;
    refreshToken: string;
  };
  message: string;
}

// --- Attendance API ---
export interface TodayStatsResponse {
  statusCode: number;
  data: {
    total: number;
    present: number;
    onLeave: number;
    absent: number;
    late?: number;
    presentEmployees?: Array<{
      _id: string;
      name: string;
      email: string;
      punchInTime: string | null;
      punchOutTime: string | null;
      arrivalStatus: string;
    }>;
    onLeaveEmployees?: Array<{
      _id: string;
      name: string;
      email: string;
      leaveType: string;
      startDate: string | Date;
      endDate: string | Date;
    }>;
    absentEmployees?: Array<{
      _id: string;
      name: string;
      email: string;
    }>;
  };
  message: string;
}

export interface AttendanceResponse {
  statusCode: number;
  data: IAttendance[];
  message: string;
}

// --- Leave API ---
export interface LeaveResponse {
  statusCode: number;
  data: ILeave[];
  message: string;
}

export interface LeaveBalanceResponse {
  statusCode: number;
  data: ILeaveBalance;
  message: string;
}

export interface MonthlyReportItem {
  employee: {
    _id: string;
    name: string;
    email: string;
    role?: string;
    departmentId?: string | null;
  };
  attendance: {
    daysPresent: number;
    totalWorkedHours: number;
    averageDailyHours?: number;
    lateArrivals?: number;
    earlyDepartures?: number;
    totalBreakMinutes?: number;
  };
  leaves: {
    approvedDays: number;
    pendingRequests?: number;
    rawList?: Array<{
      type: string;
      startDate: string | Date;
      endDate: string | Date;
      status: string;
      totalDays: number;
    }>;
  };
  overtime: {
    approvedHours: number;
    pendingRequests?: number;
    rawList?: Array<{
      requestedHours: number;
      status: string;
      reason: string;
    }>;
  };
}

export interface MonthlyReportResponse {
  statusCode: number;
  data: MonthlyReportItem[];
  message: string;
}

