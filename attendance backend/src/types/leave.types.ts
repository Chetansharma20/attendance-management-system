import mongoose from "mongoose";

export interface ILeaveBase {
  employeeId: mongoose.Types.ObjectId;
  leaveType: "sick" | "casual" | "earned" | "unpaid";
  startDate: Date;
  endDate: Date;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy: mongoose.Types.ObjectId | null;
  approvedAt: Date | null;
  rejectionReason: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILeaveBalanceBase {
  employeeId: mongoose.Types.ObjectId;
  year: number;
  sick: number;
  casual: number;
  earned: number;
  sickTotal: number;
  casualTotal: number;
  earnedTotal: number;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface ILeavePolicyBase {
  sick: number;
  casual: number;
  earned: number;
  updatedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
