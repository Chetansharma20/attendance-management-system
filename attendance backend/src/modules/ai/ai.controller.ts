import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { handleAiChat } from "./ai.service.js";
import { ApiError } from "../../utils/ApiError.js";

export const askAiAssistant = asyncHandler(async (req: Request, res: Response) => {
  const { history } = req.body;
  const userId = (req as any).user?._id;
  const userRole = (req as any).user?.role;

  if (!userId) {
    throw new ApiError(401, "Unauthorized access. User ID not found in session.");
  }

  if (!history || !Array.isArray(history) || history.length === 0) {
    throw new ApiError(400, "Please provide chat history with at least one user message.");
  }

  // Execute Gemini chat sequence
  const aiResponse = await handleAiChat(userId, userRole, history);

  res.status(200).json(
    new ApiResponse(200, { response: aiResponse }, "AI response generated successfully")
  );
});
