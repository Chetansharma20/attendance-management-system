import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { registerUser, getUsersExceptAdmin, getMyTeamService } from "../services/userService.js";

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);

  res.status(201).json(
    new ApiResponse(201, user, "User registered successfully")
  );
});



export const fetchUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;

  const users = await getUsersExceptAdmin(role, page, limit);

  res.status(200).json(
    new ApiResponse(200, users, "Users fetched successfully")
  );
});

export const getMyTeam = asyncHandler(async (req, res) => {
  const employees = await getMyTeamService(req.user._id);

  res.status(200).json(
    new ApiResponse(200, employees, "Team fetched successfully")
  );
});
