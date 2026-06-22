import Settings from "../models/settings.js";

export const getGeofenceSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      geofenceLatitude: 0,
      geofenceLongitude: 0,
      geofenceRadius: 100,
      geofenceEnabled: false,
    });
  }
  return settings;
};

export const updateGeofenceSettings = async (data) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings();
  }
  
  if (data.geofenceLatitude !== undefined) settings.geofenceLatitude = data.geofenceLatitude;
  if (data.geofenceLongitude !== undefined) settings.geofenceLongitude = data.geofenceLongitude;
  if (data.geofenceRadius !== undefined) settings.geofenceRadius = data.geofenceRadius;
  if (data.geofenceEnabled !== undefined) settings.geofenceEnabled = data.geofenceEnabled;

  await settings.save();
  return settings;
};
