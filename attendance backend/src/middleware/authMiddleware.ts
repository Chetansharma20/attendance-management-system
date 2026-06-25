import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUserById } from "../modules/user/user.repository.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyJWT = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized: No token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const user = await findUserById(decoded.userId);

    if (!user) {
      throw new ApiError(401, "Unauthorized: User not found");
    }

    (req as any).user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Unauthorized: Invalid token");
  }
});

const allowedRoles = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.role)) {
      throw new ApiError(403, "Access denied: Insufficient permissions");
    }
    next();
  };
};

export default verifyJWT;
export { allowedRoles };
