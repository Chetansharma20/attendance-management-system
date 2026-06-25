import { findSettings, createSettings } from "./settings.repository.js";
import Settings from "./settings.js";

export const getGeofenceSettings = async () => {
  let settings = await findSettings();
  if (!settings) {
    settings = await createSettings({
      geofenceLatitude: 0,
      geofenceLongitude: 0,
      geofenceRadius: 100,
      geofenceEnabled: false,
      workStartTime: "09:00",
      workEndTime: "18:00",
      gracePeriod: 15,
    });
  }
  return settings;
};

export const updateGeofenceSettings = async (data: any) => {
  let settings = await findSettings();
  if (!settings) {
    settings = new Settings();
  }

  if (data.geofenceLatitude !== undefined) settings.geofenceLatitude = data.geofenceLatitude;
  if (data.geofenceLongitude !== undefined) settings.geofenceLongitude = data.geofenceLongitude;
  if (data.geofenceRadius !== undefined) settings.geofenceRadius = data.geofenceRadius;
  if (data.geofenceEnabled !== undefined) settings.geofenceEnabled = data.geofenceEnabled;
  if (data.workStartTime !== undefined) settings.workStartTime = data.workStartTime;
  if (data.workEndTime !== undefined) settings.workEndTime = data.workEndTime;
  if (data.gracePeriod !== undefined) settings.gracePeriod = data.gracePeriod;

  await settings.save();
  return settings;
};
