import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { registerUser, getUsersExceptAdmin, getMyTeamService, getUserProfileService } from "./user.service.js";
import User from "./users.js";
import { ApiError } from "../../utils/ApiError.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const file = (req as any).file;
  const profilePic = file ? `/uploads/${file.filename}` : "";
  const user = await registerUser({ ...req.body, profilePic });
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
  const profile = await getUserProfileService(req.params.id as string);
  res.status(200).json(new ApiResponse(200, profile, "User profile fetched successfully"));
});

export const uploadProfilePic = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user._id;
  const file = (req as any).file;

  if (!file) {
    throw new ApiError(400, "Please upload a profile picture file");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Restrict to single upload
  if (user.profilePic && user.profilePic !== "") {
    throw new ApiError(400, "You have already uploaded a profile picture. Profile pictures can only be uploaded once.");
  }

  const fileUrl = `/uploads/${file.filename}`;
  user.profilePic = fileUrl;
  await user.save();

  res.status(200).json(new ApiResponse(200, { profilePic: fileUrl }, "Profile picture uploaded successfully"));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, email, role, departmentId, shiftId, managerId } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  
  if (departmentId !== undefined) user.departmentId = departmentId || null;
  if (shiftId !== undefined) user.shiftId = shiftId || null;
  if (managerId !== undefined) user.managerId = managerId || null;

  await user.save();
  res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.role === 'admin') {
    throw new ApiError(400, "Admin accounts cannot be deleted");
  }

  await user.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "User deleted successfully"));
});
