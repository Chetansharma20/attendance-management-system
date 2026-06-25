import mongoose, { Document, Schema } from "mongoose";
import { ILeavePolicyBase } from "../../types/leave.types.js";

export interface ILeavePolicy extends ILeavePolicyBase, Document {}

const leavePolicySchema = new Schema<ILeavePolicy>(
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
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const LeavePolicy = mongoose.model<ILeavePolicy>("LeavePolicy", leavePolicySchema);

export default LeavePolicy;
