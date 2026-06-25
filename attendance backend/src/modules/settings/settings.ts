import mongoose, { Document, Schema } from "mongoose";

export interface ISettings extends Document {
  geofenceLatitude: number;
  geofenceLongitude: number;
  geofenceRadius: number;
  geofenceEnabled: boolean;
  workStartTime: string;
  workEndTime: string;
  gracePeriod: number;
  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    geofenceLatitude: {
      type: Number,
      required: true,
      default: 0,
    },
    geofenceLongitude: {
      type: Number,
      required: true,
      default: 0,
    },
    geofenceRadius: {
      type: Number,
      required: true,
      default: 100,
    },
    geofenceEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
    workStartTime: {
      type: String,
      required: true,
      default: "09:00",
    },
    workEndTime: {
      type: String,
      required: true,
      default: "18:00",
    },
    gracePeriod: {
      type: Number,
      required: true,
      default: 15,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model<ISettings>("Settings", settingsSchema);

export default Settings;
