import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true, // e.g., "09:00" (HH:MM format)
    },
    endTime: {
      type: String,
      required: true, // e.g., "18:00" (HH:MM format)
    },
    gracePeriod: {
      type: Number,
      required: true,
      default: 15, // in minutes
    },
  },
  {
    timestamps: true,
  }
);

const Shift = mongoose.model("Shift", shiftSchema);

export default Shift;
