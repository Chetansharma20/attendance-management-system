import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { getGeofenceSettings, updateGeofenceSettings } from "./settings.service.js";

export const getGeofence = asyncHandler(async (req, res) => {
  const settings = await getGeofenceSettings();
  res.status(200).json(new ApiResponse(200, settings, "Geofence settings fetched successfully"));
});

export const updateGeofence = asyncHandler(async (req, res) => {
  const settings = await updateGeofenceSettings(req.body);
  res.status(200).json(new ApiResponse(200, settings, "Geofence settings updated successfully"));
});
