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

import {
  getMyProfileDeclaration,
  getMyAttendanceDeclaration,
  getMyLeavesDeclaration,
  getLateArrivalsTodayDeclaration,
  getPendingLeaveRequestsDeclaration,
  getEmployeeAttendanceSummaryDeclaration,
} from "./ai.tools.js";

import { createToolExecutors } from "./ai.executors.js";

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
