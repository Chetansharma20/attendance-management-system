import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { registerUser, getUsersExceptAdmin, getMyTeamService, getUserProfileService } from "./user.service.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await registerUser(req.body);
  res.status(201).json(new ApiResponse(201, user, "User registered successfully"));
});

export const fetchUsers = asyncHandler(async (req: Request, res: Response) => {
  const role = req.query.role as string | undefined;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const users = await getUsersExceptAdmin(role, page, limit);
  res.status(200).json(new ApiResponse(200, users, "Users fetched successfully"));
});

export const getMyTeam = asyncHandler(async (req: Request, res: Response) => {
  const employees = await getMyTeamService((req as any).user._id);
  res.status(200).json(new ApiResponse(200, employees, "Team fetched successfully"));
});

export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getUserProfileService(req.params.id);
  res.status(200).json(new ApiResponse(200, profile, "User profile fetched successfully"));
});
