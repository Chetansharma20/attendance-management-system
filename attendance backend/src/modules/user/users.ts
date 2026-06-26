import mongoose, { Document, Schema } from "mongoose";
import { IUserBase } from "../../types/user.types.js";

export interface IUser extends IUserBase, Document {}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },

    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    shiftId: {
      type: Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
    },

    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    profilePic: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ managerId: 1, role: 1 });

const User = mongoose.model<IUser>("User", userSchema);

export default User;
