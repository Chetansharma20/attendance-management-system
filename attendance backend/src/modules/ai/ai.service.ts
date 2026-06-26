import { GoogleGenerativeAI, FunctionDeclaration } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import User from "../user/users.js";
import Attendance from "../attendance/attendance.js";
import Leave from "../leave/leave.js";
import { ApiError } from "../../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load policies content
const policyPath = path.join(__dirname, "data", "hr_policies.md");
let hrPoliciesContent = "";
try {
  hrPoliciesContent = fs.readFileSync(policyPath, "utf-8");
} catch (error) {
  console.error("Failed to read HR policies file:", error);
}

// Initialize Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Tool Declarations
const getMyProfileDeclaration: FunctionDeclaration = {
  name: "get_my_profile",
  description: "Returns the profile details of the currently logged-in user, including their name, email, role, department, shift, and manager.",
  parameters: {
    type: "OBJECT" as any,
    properties: {},
  },
};

const getMyAttendanceDeclaration: FunctionDeclaration = {
  name: "get_my_attendance",
  description: "Returns the current month's daily attendance records (punches, arrival status, working hours) for the logged-in user.",
  parameters: {
    type: "OBJECT" as any,
    properties: {},
  },
};

const getMyLeavesDeclaration: FunctionDeclaration = {
  name: "get_my_leaves",
  description: "Returns all leave requests, balances, and request statuses applied by the logged-in user.",
  parameters: {
    type: "OBJECT" as any,
    properties: {},
  },
};

const getLateArrivalsTodayDeclaration: FunctionDeclaration = {
  name: "get_late_arrivals_today",
  description: "Manager/Admin only. Returns a list of employees who checked in late today.",
  parameters: {
    type: "OBJECT" as any,
    properties: {},
  },
};

const getPendingLeaveRequestsDeclaration: FunctionDeclaration = {
  name: "get_pending_leave_requests",
  description: "Manager/Admin only. Returns a list of all pending leave applications currently awaiting approval.",
  parameters: {
    type: "OBJECT" as any,
    properties: {},
  },
};

const getEmployeeAttendanceSummaryDeclaration: FunctionDeclaration = {
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

// Tool executors mapping
const createToolExecutors = (userId: string, userRole: string) => {
  return {
    get_my_profile: async () => {
      const user = await User.findById(userId)
        .populate("managerId", "name email")
        .populate("departmentId", "name")
        .populate("shiftId", "name startTime endTime");
      if (!user) return { error: "User profile not found." };
      return {
        name: user.name,
        email: user.email,
        role: user.role,
        department: (user.departmentId as any)?.name || "Unassigned",
        shift: (user.shiftId as any) ? `${(user.shiftId as any).name} (${(user.shiftId as any).startTime} - ${(user.shiftId as any).endTime})` : "Default Shift",
        manager: (user.managerId as any)?.name || "No direct manager",
      };
    },

    get_my_attendance: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const logs = await Attendance.find({
        employeeId: userId,
        date: { $gte: startOfMonth },
      }).sort({ date: 1 });

      return logs.map(l => ({
        date: l.date.toISOString().split("T")[0],
        arrivalStatus: l.arrivalStatus,
        departureStatus: l.departureStatus,
        workingHours: l.workingHours.toFixed(2),
        punches: l.punches.map(p => ({ type: p.type, time: p.time })),
      }));
    },

    get_my_leaves: async () => {
      const leaves = await Leave.find({ employeeId: userId }).sort({ startDate: -1 });
      return leaves.map(l => ({
        leaveType: l.leaveType,
        startDate: l.startDate.toISOString().split("T")[0],
        endDate: l.endDate.toISOString().split("T")[0],
        totalDays: l.totalDays,
        status: l.status,
        reason: l.reason,
      }));
    },

    get_late_arrivals_today: async () => {
      if (userRole !== "manager" && userRole !== "admin") {
        return { error: "Unauthorized. This tool is only available for managers and admins." };
      }
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const logs = await Attendance.find({
        date: { $gte: start, $lte: end },
        arrivalStatus: "late",
      }).populate("employeeId", "name email");

      return logs.map(l => ({
        employeeName: (l.employeeId as any)?.name || "Unknown",
        employeeEmail: (l.employeeId as any)?.email || "Unknown",
        punches: l.punches.map(p => ({ type: p.type, time: p.time })),
      }));
    },

    get_pending_leave_requests: async () => {
      if (userRole !== "manager" && userRole !== "admin") {
        return { error: "Unauthorized. This tool is only available for managers and admins." };
      }
      const leaves = await Leave.find({ status: "pending" }).populate("employeeId", "name email");
      return leaves.map(l => ({
        leaveId: l._id,
        employeeName: (l.employeeId as any)?.name || "Unknown",
        employeeEmail: (l.employeeId as any)?.email || "Unknown",
        leaveType: l.leaveType,
        startDate: l.startDate.toISOString().split("T")[0],
        endDate: l.endDate.toISOString().split("T")[0],
        totalDays: l.totalDays,
        reason: l.reason,
      }));
    },

    get_employee_attendance_summary: async (args: { employeeIdentifier: string }) => {
      if (userRole !== "manager" && userRole !== "admin") {
        return { error: "Unauthorized. This tool is only available for managers and admins." };
      }
      const targetUser = await User.findOne({
        $or: [
          { name: { $regex: args.employeeIdentifier, $options: "i" } },
          { email: { $regex: args.employeeIdentifier, $options: "i" } },
        ],
      });

      if (!targetUser) {
        return { error: `Employee matching "${args.employeeIdentifier}" was not found.` };
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const logs = await Attendance.find({
        employeeId: targetUser._id,
        date: { $gte: startOfMonth },
      });

      const daysPresent = logs.length;
      const lateArrivals = logs.filter(l => l.arrivalStatus === "late").length;
      const totalHours = logs.reduce((sum, l) => sum + (l.workingHours || 0), 0);

      return {
        employeeName: targetUser.name,
        employeeEmail: targetUser.email,
        role: targetUser.role,
        summaryThisMonth: {
          daysPresent,
          lateArrivals,
          totalHoursWorked: totalHours.toFixed(1),
        },
      };
    },
  };
};

export const handleAiChat = async (
  userId: string,
  userRole: string,
  messageHistory: { role: "user" | "model"; parts: { text: string }[] }[]
) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(500, "Gemini API key is not configured in backend environment.");
  }

  // Set up allowed tools depending on role
  const toolsList = [
    getMyProfileDeclaration,
    getMyAttendanceDeclaration,
    getMyLeavesDeclaration,
  ];

  if (userRole === "manager" || userRole === "admin") {
    toolsList.push(
      getLateArrivalsTodayDeclaration,
      getPendingLeaveRequestsDeclaration,
      getEmployeeAttendanceSummaryDeclaration
    );
  }

  const systemInstruction = `
    You are the Attendance Management System's AI HR Assistant. 
    You help employees and managers answer questions about leaves, shift timings, check-ins/outs, and company policies.
    
    ### COMPANY POLICIES (Context Injection):
    ${hrPoliciesContent}
    
    ### RULES OF ENGAGEMENT:
    - You must answer questions using company policies context injection first. If the information isn't in policies, check live data using your tools.
    - If a user asks about their profile, leaves, or attendance, use the corresponding database tool.
    - Be polite, clean, professional, and write concise responses formatted in markdown.
    - Security Constraint: You must not execute manager-only tools if the user is not a manager or admin. You already have filter guards but ensure you do not tell employees about other employees' metrics.
  `;

  // Start Gemini session
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
  });

  const executors: any = createToolExecutors(userId, userRole);

  // We convert history to standard format
  const chatSession = model.startChat({
    history: messageHistory.map(h => ({
      role: h.role,
      parts: h.parts,
    })),
    tools: [{ functionDeclarations: toolsList }],
  });

  // Extract the latest user message
  const lastUserMsg = messageHistory[messageHistory.length - 1]?.parts[0]?.text || "";

  let response = await chatSession.sendMessage(lastUserMsg);

  // Core loop to handle iterative function calling
  let functionCalls = response.response.functionCalls();
  while (functionCalls && functionCalls.length > 0) {
    const responses = [];
    for (const call of functionCalls) {
      const executor = executors[call.name];
      if (executor) {
        try {
          const result = await executor(call.args);
          responses.push({
            functionResponse: {
              name: call.name,
              response: { result },
            },
          });
        } catch (execError: any) {
          responses.push({
            functionResponse: {
              name: call.name,
              response: { error: execError.message || "Failed to execute database tool." },
            },
          });
        }
      } else {
        responses.push({
          functionResponse: {
            name: call.name,
            response: { error: `Tool ${call.name} is not registered.` },
          },
        });
      }
    }

    // Send function responses back to Gemini
    response = await chatSession.sendMessage(responses);
    functionCalls = response.response.functionCalls();
  }

  return response.response.text();
};
