import mongoose, { Document, Schema } from "mongoose";
import { ILeaveBase } from "../../types/leave.types.js";

export interface ILeave extends ILeaveBase, Document {}

const leaveSchema = new Schema<ILeave>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["sick", "casual", "earned", "unpaid"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

leaveSchema.index({ employeeId: 1, status: 1 });
leaveSchema.index({ employeeId: 1, startDate: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });

const Leave = mongoose.model<ILeave>("Leave", leaveSchema);

export default Leave;
