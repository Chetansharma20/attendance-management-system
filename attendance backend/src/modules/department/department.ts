import mongoose, { Document, Schema } from "mongoose";

export interface IDepartment extends Document {
  name: string;
  description?: string;
  managerId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    managerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model<IDepartment>("Department", departmentSchema);

export default Department;
