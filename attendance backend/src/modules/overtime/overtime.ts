import mongoose, { Document, Schema } from "mongoose";
import { IOvertimeBase } from "../../types/overtime.types.js";

export interface IOvertime extends IOvertimeBase, Document {}

const overtimeSchema = new Schema<IOvertime>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    attendanceId: {
      type: Schema.Types.ObjectId,
      ref: "Attendance",
      required: true,
    },

    requestedHours: {
      type: Number,
      required: true,
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

overtimeSchema.index({ employeeId: 1, createdAt: -1 });
overtimeSchema.index({ status: 1 });
overtimeSchema.index({ attendanceId: 1 });

const Overtime = mongoose.model<IOvertime>("Overtime", overtimeSchema);

export default Overtime;
