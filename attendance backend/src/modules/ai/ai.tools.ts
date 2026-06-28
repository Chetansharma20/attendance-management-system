import { FunctionDeclaration } from "@google/generative-ai";

export const getMyProfileDeclaration: FunctionDeclaration = {
  name: "get_my_profile",
  description: "Returns the profile details of the currently logged-in user, including their name, email, role, department, shift, and manager.",
  parameters: {
    type: "OBJECT" as any,
    properties: {},
  },
};

export const getMyAttendanceDeclaration: FunctionDeclaration = {
  name: "get_my_attendance",
  description: "Returns the current month's daily attendance records (punches, arrival status, working hours) for the logged-in user.",
  parameters: {
    type: "OBJECT" as any,
    properties: {},
  },
};

export const getMyLeavesDeclaration: FunctionDeclaration = {
  name: "get_my_leaves",
  description: "Returns all leave requests, balances, and request statuses applied by the logged-in user.",
  parameters: {
    type: "OBJECT" as any,
    properties: {},
  },
};

export const getLateArrivalsTodayDeclaration: FunctionDeclaration = {
  name: "get_late_arrivals_today",
  description: "Manager/Admin only. Returns a list of employees who checked in late today.",
  parameters: {
    type: "OBJECT" as any,
    properties: {},
  },
};

export const getPendingLeaveRequestsDeclaration: FunctionDeclaration = {
  name: "get_pending_leave_requests",
  description: "Manager/Admin only. Returns a list of all pending leave applications currently awaiting approval.",
  parameters: {
    type: "OBJECT" as any,
    properties: {},
  },
};

export const getEmployeeAttendanceSummaryDeclaration: FunctionDeclaration = {
  name: "get_employee_attendance_summary",
  description: "Manager/Admin only. Returns a detailed attendance metrics summary (days present, late check-ins, hours worked) for a specific employee searched by their name or email address.",
  parameters: {
    type: "OBJECT" as any,
    properties: {
      employeeIdentifier: {
        type: "STRING" as any,
        description: "The name or email of the employee to query.",
      },
    },
    required: ["employeeIdentifier"],
  },
};
