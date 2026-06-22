import jwt from "jsonwebtoken";
import User from "../models/users.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { loginUser } from "../services/authService.js";
import { generateTokens } from "../utils/generateToken.js";
import { accessCookieOptions, refreshCookieOptions } from "../utils/cookieHelper.js";

export const login = asyncHandler(async (req, res) => {
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
    .cookie("accessToken", accessToken, accessCookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("accessToken", accessCookieOptions);
  res.clearCookie("refreshToken", refreshCookieOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new ApiError(401, "Unauthorized: No refresh token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN);
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      throw new ApiError(401, "Unauthorized: User not found");
    }

    const accessToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      }
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, accessCookieOptions)
      .json(
        new ApiResponse(
          200,
          { accessToken },
          "Token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Unauthorized: Invalid or expired refresh token");
  }
});
