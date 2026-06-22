import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
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
      default: 100, // default 100 meters
    },
    geofenceEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
