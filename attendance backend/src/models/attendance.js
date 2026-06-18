import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    punchIn: {
      time: Date,

      selfieUrl: String,

      location: {
        latitude: Number,
        longitude: Number,
      },
    },

    punchOut: {
      time: Date,

      selfieUrl: String,

      location: {
        latitude: Number,
        longitude: Number,
      },
    },

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
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      validatedAt: Date,
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

const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

export default Attendance;