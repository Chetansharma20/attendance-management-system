import mongoose, { Document, Schema } from "mongoose";

export interface IHoliday extends Document {
  name: string;
  date: Date;
  type: "public" | "restricted" | "other";
  description?: string;
}

const holidaySchema = new Schema<IHoliday>(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true, unique: true },
    type: { type: String, enum: ["public", "restricted", "other"], default: "public" },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

const Holiday = mongoose.model<IHoliday>("Holiday", holidaySchema);
export default Holiday;
