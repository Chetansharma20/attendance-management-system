import { ApiError } from "./ApiError.js";

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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

export const calculateWorkingHours = (punches: any[], breaks?: any[]): number => {
  let totalMs = 0;
  for (let i = 0; i < punches.length - 1; i += 2) {
    const punchIn = punches[i];
    const punchOut = punches[i + 1];
    if (punchIn.type === "in" && punchOut && punchOut.type === "out") {
      totalMs += new Date(punchOut.time).getTime() - new Date(punchIn.time).getTime();
    }
  }

  if (breaks && breaks.length > 0) {
    breaks.forEach((b) => {
      if (b.startTime && b.endTime) {
        totalMs -= new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
      }
    });
  }

  return Number(Math.max(0, totalMs / (1000 * 60 * 60)).toFixed(2));
};

export const getTodayRange = (): { start: Date; end: Date } => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

export const validateGeofence = (settings: any, latitude: number, longitude: number, actionName = "Clock-in"): void => {
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

export const getUserBreakPolicy = (user: any): any => {
  return user?.shiftId?.breakPolicy || {
    tea: { maxCount: 2, duration: 15 },
    lunch: { enabled: true, duration: 60 },
    dinner: { enabled: false, duration: 60 }
  };
};

/**
 * Count weekday (Mon–Fri) days between two dates, inclusive.
 * Saturday (6) and Sunday (0) are excluded.
 */
export const countWeekdays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++; // 0 = Sun, 6 = Sat
    current.setDate(current.getDate() + 1);
  }
  return count;
};
