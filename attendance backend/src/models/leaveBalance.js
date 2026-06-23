import mongoose from "mongoose";

// One balance document per employee per year.
// Auto-created from LeavePolicy defaults when first needed.
const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    // Remaining days for each paid leave type
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

    // Total allocated (for display purposes — shows original quota)
    sickTotal: { type: Number, default: 10 },
    casualTotal: { type: Number, default: 12 },
    earnedTotal: { type: Number, default: 15 },
  },
  {
    timestamps: true,
  }
);

// Unique balance per employee per year
leaveBalanceSchema.index({ employeeId: 1, year: 1 }, { unique: true });

const LeaveBalance = mongoose.model("LeaveBalance", leaveBalanceSchema);

export default LeaveBalance;
