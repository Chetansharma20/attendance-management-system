import { ApiError } from "./ApiError.js";

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const calculateWorkingHours = (punches, breaks) => {
  let totalMs = 0;
  for (let i = 0; i < punches.length - 1; i += 2) {
    const punchIn = punches[i];
    const punchOut = punches[i + 1];
    if (punchIn.type === "in" && punchOut && punchOut.type === "out") {
      totalMs += new Date(punchOut.time) - new Date(punchIn.time);
    }
  }
  
  if (breaks && breaks.length > 0) {
    breaks.forEach((b) => {
      if (b.startTime && b.endTime) {
        totalMs -= (new Date(b.endTime) - new Date(b.startTime));
      }
    });
  }

  return Number(Math.max(0, totalMs / (1000 * 60 * 60)).toFixed(2));
};

export const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const validateGeofence = (settings, latitude, longitude, actionName = "Clock-in") => {
  if (settings && settings.geofenceEnabled) {
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      throw new ApiError(400, "Location coordinates are required when geofencing is enabled");
    }
    const distance = calculateDistance(settings.geofenceLatitude, settings.geofenceLongitude, latitude, longitude);
    if (distance > settings.geofenceRadius) {
      throw new ApiError(
        400,
        `${actionName} blocked: You are outside the allowed geofence boundary (Distance: ${distance.toFixed(1)}m, Limit: ${settings.geofenceRadius}m)`
      );
    }
  }
};

export const getUserBreakPolicy = (user) => {
  return user?.shiftId?.breakPolicy || {
    tea: { maxCount: 2, duration: 15 },
    lunch: { enabled: true, duration: 60 },
    dinner: { enabled: false, duration: 60 }
  };
};
