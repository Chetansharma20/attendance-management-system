import mongoose, { Document, Schema } from "mongoose";

export interface IShift extends Document {
  name: string;
  startTime: string;
  endTime: string;
  gracePeriod: number;
  breakPolicy: {
    tea: {
      maxCount: number;
      duration: number;
    };
    lunch: {
      enabled: boolean;
      duration: number;
    };
    dinner: {
      enabled: boolean;
      duration: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const shiftSchema = new Schema<IShift>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    gracePeriod: {
      type: Number,
      required: true,
      default: 15,
    },
    breakPolicy: {
      tea: {
        maxCount: { type: Number, default: 2 },
        duration: { type: Number, default: 15 },
      },
      lunch: {
        enabled: { type: Boolean, default: true },
        duration: { type: Number, default: 60 },
      },
      dinner: {
        enabled: { type: Boolean, default: false },
        duration: { type: Number, default: 60 },
      },
    },
  },
  {
    timestamps: true,
  }
);

const Shift = mongoose.model<IShift>("Shift", shiftSchema);

export default Shift;
