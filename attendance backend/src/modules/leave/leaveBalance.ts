import mongoose, { Document, Schema } from "mongoose";
import { ILeaveBalanceBase } from "../../types/leave.types.js";

export interface ILeaveBalance extends ILeaveBalanceBase, Document {}

const leaveBalanceSchema = new Schema<ILeaveBalance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    sick: {
      type: Number,
      default: 10,
      min: 0,
    },

    casual: {
      type: Number,
      default: 12,
      min: 0,
    },

    earned: {
      type: Number,
      default: 15,
      min: 0,
    },

    sickTotal: { type: Number, default: 10 },
    casualTotal: { type: Number, default: 12 },
    earnedTotal: { type: Number, default: 15 },
  },
  {
    timestamps: true,
  }
);

leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

const LeaveBalance = mongoose.model<ILeaveBalance>("LeaveBalance", leaveBalanceSchema);

export default LeaveBalance;
