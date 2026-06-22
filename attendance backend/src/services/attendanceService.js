import Attendance from "../models/attendance.js";
import User from "../models/users.js";
import Overtime from "../models/overtime.js";
import Settings from "../models/settings.js";
import { ApiError } from "../utils/ApiError.js";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
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

  return R * c; // in meters
};

export const punchInService = async (
  userId,
  latitude,
  longitude,
  selfieUrl
) => {
  // Check geofence settings
  const settings = await Settings.findOne();
  if (settings && settings.geofenceEnabled) {
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      throw new ApiError(400, "Location coordinates are required when geofencing is enabled");
    }
    const distance = calculateDistance(
      settings.geofenceLatitude,
      settings.geofenceLongitude,
      latitude,
      longitude
    );
    if (distance > settings.geofenceRadius) {
      throw new ApiError(
        400,
        `Clock-in blocked: You are outside the allowed geofence boundary (Distance: ${distance.toFixed(1)}m, Limit: ${settings.geofenceRadius}m)`
      );
    }
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const existingAttendance = await Attendance.findOne({
    employeeId: userId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  if (existingAttendance) {
    throw new ApiError(
      400,
      "You have already punched in today"
    );
  }

  const attendance = await Attendance.create({
    employeeId: userId,

    date: new Date(),

    punchIn: {
      time: new Date(),

      selfieUrl,

      location: {
        latitude,
        longitude,
      },
    },
  });

  return attendance;
};


export const punchOutService = async (
  userId,
  latitude,
  longitude,
  selfieUrl
) => {
  // Check geofence settings
  const settings = await Settings.findOne();
  if (settings && settings.geofenceEnabled) {
    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      throw new ApiError(400, "Location coordinates are required when geofencing is enabled");
    }
    const distance = calculateDistance(
      settings.geofenceLatitude,
      settings.geofenceLongitude,
      latitude,
      longitude
    );
    if (distance > settings.geofenceRadius) {
      throw new ApiError(
        400,
        `Clock-out blocked: You are outside the allowed geofence boundary (Distance: ${distance.toFixed(1)}m, Limit: ${settings.geofenceRadius}m)`
      );
    }
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const attendance = await Attendance.findOne({
    employeeId: userId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  if (!attendance) {
    throw new ApiError(
      404,
      "No punch in found for today"
    );
  }

  if (attendance.punchOut?.time) {
    throw new ApiError(
      400,
      "Already punched out"
    );
  }

  const punchOutTime = new Date();

  attendance.punchOut = {
    time: punchOutTime,
    selfieUrl,
    location: {
      latitude,
      longitude,
    },
  };

  const diffMs =
    punchOutTime - attendance.punchIn.time;

  const workingHours =
    diffMs / (1000 * 60 * 60);

  attendance.workingHours =
    Number(workingHours.toFixed(2));

  attendance.completionStatus =
    workingHours >= 8 ? "completed" : "incomplete";

  await attendance.save();

  return attendance;
};

export const getMyAttendanceService = async (
  userId,
  date
) => {
  const query = {
    employeeId: userId
  }
    if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    query.date = {
      $gte: start,
      $lte: end,
    };
  }
  const attendances = await Attendance.find(query)
    .sort({ date: -1 })
    .populate(
      "employeeId",
      "name email role"
    );


  const attendanceIds = attendances.map((a) => a._id);
  const overtimes = await Overtime.find({ attendanceId: { $in: attendanceIds } });
  const overtimeMap = {};
  overtimes.forEach((ot) => {
    overtimeMap[ot.attendanceId.toString()] = ot;
  });

  return attendances.map((a) => {
    const obj = a.toObject();
    obj.overtimeRequest = overtimeMap[a._id.toString()] || null;
    return obj;
  });
};



export const getAttendanceByEmployeeIdService =
  async (employeeId) => {
    const attendances = await Attendance.find({
      employeeId,
    })
      .populate(
        "employeeId",
        "name email role"
      )
      .sort({ date: -1 });

    if (!attendances.length) {
      throw new ApiError(
        404,
        "No attendance records found"
      );
    }

    return attendances;
  };



export const getTeamAttendanceService =
  async (managerId) => {
    const employees = await User.find({
      managerId,
      role: "employee",
    });

    if (!employees.length) {
      throw new ApiError(
        404,
        "No team members found"
      );
    }

    const employeeIds = employees.map(
      (emp) => emp._id
    );

    const attendances =
      await Attendance.find({
        employeeId: {
          $in: employeeIds,
        },
      })
        .populate(
          "employeeId",
          "name email"
        )
        .sort({ date: -1 });

    const attendanceIds = attendances.map((a) => a._id);
    const overtimes = await Overtime.find({ attendanceId: { $in: attendanceIds } });
    const overtimeMap = {};
    overtimes.forEach((ot) => {
      overtimeMap[ot.attendanceId.toString()] = ot;
    });

    return attendances.map((a) => {
      const obj = a.toObject();
      obj.overtimeRequest = overtimeMap[a._id.toString()] || null;
      return obj;
    });
  };

export const getAllAttendanceService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [attendances, total] = await Promise.all([
    Attendance.find()
      .populate("employeeId", "name email role")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(),
  ]);

  const attendanceIds = attendances.map((a) => a._id);
  const overtimes = await Overtime.find({ attendanceId: { $in: attendanceIds } });
  const overtimeMap = {};
  overtimes.forEach((ot) => {
    overtimeMap[ot.attendanceId.toString()] = ot;
  });

  const formattedAttendances = attendances.map((a) => {
    const obj = a.toObject();
    obj.overtimeRequest = overtimeMap[a._id.toString()] || null;
    return obj;
  });

  return {
    attendances: formattedAttendances,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};