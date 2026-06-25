import { ApiError } from "../../utils/ApiError.js";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "../user/user.repository.js";

export const loginUser = async ({ email, password }: any) => {
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password as string);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  return user;
};
