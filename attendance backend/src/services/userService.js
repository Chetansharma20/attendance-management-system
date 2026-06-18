import bcrypt from "bcryptjs";
import User from "../models/users.js";
import { ApiError } from "../utils/ApiError.js";

export const registerUser = async ({
  name,
  email,
  password,
  role = "employee",
  managerId,
}) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    managerId: role === "employee" ? managerId : null,
  });

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    managerId: user.managerId,
  };
};

export const getUsersExceptAdmin = async (roleFilter, page = 1, limit = 10) => {
  const query = { role: { $ne: "admin" } };

  if (roleFilter && roleFilter !== "all") {
    query.role = roleFilter;
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select("-password")
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getMyTeamService = async (managerId) => {
  return await User.find({ managerId, role: "employee" }).select("-password");
};
