import mongoose from "mongoose";

// Singleton document — company-wide leave allocation defaults.
// Admin can update these. Changes apply to newly created balance records only.
const leavePolicySchema = new mongoose.Schema(
  {
    sick: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },

    casual: {
      type: Number,
      required: true,
      default: 12,
      min: 0,
    },

    earned: {
      type: Number,
      required: true,
      default: 15,
      min: 0,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const LeavePolicy = mongoose.model("LeavePolicy", leavePolicySchema);

export default LeavePolicy;
