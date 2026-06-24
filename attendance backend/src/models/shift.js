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
    breakPolicy: {
      tea: {
        maxCount: { type: Number, default: 2 },
        duration: { type: Number, default: 15 } // in minutes
      },
      lunch: {
        enabled: { type: Boolean, default: true },
        duration: { type: Number, default: 60 } // in minutes
      },
      dinner: {
        enabled: { type: Boolean, default: false },
        duration: { type: Number, default: 60 } // in minutes
      }
    },
  },
  {
    timestamps: true,
  }
);

const Shift = mongoose.model("Shift", shiftSchema);

export default Shift;
