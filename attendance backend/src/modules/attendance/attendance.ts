import mongoose, { Document, Schema } from "mongoose";
import { IAttendanceBase } from "../../types/attendance.types.js";
import type { IPunch, IBreak } from "../../types/attendance.types.js";

export type { IPunch, IBreak };
export interface IAttendance extends IAttendanceBase, Document {}

const attendanceSchema = new Schema<IAttendance>(
  {
    employeeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    punches: [
      {
        type: {
          type: String,
          enum: ["in", "out"],
          required: true,
        },
        time: {
          type: Date,
          required: true,
        },
        selfieUrl: String,
        location: {
          latitude: Number,
          longitude: Number,
        },
      },
    ],

    breaks: [
      {
        type: {
          type: String,
          enum: ["tea", "lunch", "dinner"],
          required: true,
        },
        startTime: {
          type: Date,
          required: true,
        },
        endTime: {
          type: Date,
        },
      },
    ],

    workingHours: {
      type: Number,
      default: 0,
    },

    completionStatus: {
      type: String,
      enum: ["completed", "incomplete"],
      default: "incomplete",
    },

    validation: {
      status: {
        type: String,
        enum: ["pending", "valid", "invalid"],
        default: "pending",
      },

      remarks: {
        type: String,
        default: "",
      },

      validatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },

      validatedAt: Date,
    },

    arrivalStatus: {
      type: String,
      enum: ["on-time", "late"],
      default: "on-time",
    },

    departureStatus: {
      type: String,
      enum: ["regular", "early-departure"],
      default: "regular",
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index(
  {
    employeeId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

attendanceSchema.index({ date: -1 });
attendanceSchema.index({ employeeId: 1, date: -1 });

const Attendance = mongoose.model<IAttendance>(
  "Attendance",
  attendanceSchema
);

export default Attendance;
