import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { findUserById } from "../user/user.repository.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { loginUser } from "./auth.service.js";
import { generateTokens } from "../../utils/generateToken.js";
import { accessCookieOptions, refreshCookieOptions } from "../../utils/cookieHelper.js";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await loginUser(req.body);

  const { accessToken, refreshToken } = generateTokens(user);

  const loggedInUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    managerId: user.managerId,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, accessCookieOptions as any)
    .cookie("refreshToken", refreshToken, refreshCookieOptions as any)
    .json(
      new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, "User logged in successfully")
    );
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  res.clearCookie("accessToken", accessCookieOptions as any);
  res.clearCookie("refreshToken", refreshCookieOptions as any);

  return res.status(200).json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new ApiError(401, "Unauthorized: No refresh token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN as string) as any;
    const user = await findUserById(decoded.userId);

    if (!user) {
      throw new ApiError(401, "Unauthorized: User not found");
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "15m" }
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, accessCookieOptions as any)
      .json(new ApiResponse(200, { accessToken }, "Token refreshed successfully"));
  } catch (error) {
    throw new ApiError(401, "Unauthorized: Invalid or expired refresh token");
  }
});
