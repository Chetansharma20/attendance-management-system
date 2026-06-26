import mongoose from "mongoose";

export interface IUserBase {
  name: string;
  email: string;
  password?: string;
  role: "admin" | "manager" | "employee";
  managerId: mongoose.Types.ObjectId | null;
  shiftId: mongoose.Types.ObjectId | null;
  departmentId: mongoose.Types.ObjectId | null;
  profilePic?: string;
  createdAt: Date;
  updatedAt: Date;
}
