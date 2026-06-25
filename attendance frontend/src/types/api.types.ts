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
  };
  attendance: {
    daysPresent: number;
    totalWorkedHours: number;
  };
  leaves: {
    approvedDays: number;
  };
  overtime: {
    approvedHours: number;
  };
}

export interface MonthlyReportResponse {
  statusCode: number;
  data: MonthlyReportItem[];
  message: string;
}

