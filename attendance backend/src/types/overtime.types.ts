import mongoose from "mongoose";

export interface IOvertimeBase {
  employeeId: mongoose.Types.ObjectId;
  attendanceId: mongoose.Types.ObjectId;
  requestedHours: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approvedBy: mongoose.Types.ObjectId | null;
  approvedAt: Date | null;
  rejectionReason: string;
  createdAt: Date;
  updatedAt: Date;
}
