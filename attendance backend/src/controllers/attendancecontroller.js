import { getAllAttendanceService, getAttendanceByEmployeeIdService, getMyAttendanceService, getTeamAttendanceService, punchInService, punchOutService } from "../services/attendanceService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";


export const punchIn = asyncHandler(
  async (req, res) => {
    const { latitude, longitude, selfieUrl } =
      req.body;

    const attendance = await punchInService(
      req.user._id,
      latitude,
      longitude,
      selfieUrl
    );

    res.status(201).json(new ApiResponse(201, attendance, "Punch in successful"))
  }
);


export const punchOut = asyncHandler(
  async (req, res) => {
    const { latitude, longitude, selfieUrl } =
      req.body;

    const attendance =
      await punchOutService(
        req.user._id,
        latitude,
        longitude,
        selfieUrl
      );

    res.status(200).json(new ApiResponse(200, attendance, "Punch out successful"));
  }
);

export const getMyAttendance =
  asyncHandler(async (req, res) => {
    const attendances =
      await getMyAttendanceService(
        req.user._id,
        req.query.date
      );

    res.status(200).json(new ApiResponse(200, 
      attendances,
       "Attendance fetched successfully"));
  });

  export const getAttendanceByEmployeeId =
  asyncHandler(async (req, res) => {
    const attendance =
      await getAttendanceByEmployeeIdService(
        req.params.employeeId
      );

    res.status(200).json(new ApiResponse(200, attendance, "Attendance fetched successfully"));
});


export const getTeamAttendance =
  asyncHandler(async (req, res) => {
    const attendances =
      await getTeamAttendanceService(
        req.user._id
      );

    res.status(200).json(new ApiResponse(200, attendances, "Attendance fetched successfully"));
  });

export const getAllAttendance = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const data = await getAllAttendanceService(page, limit);
  res.status(200).json(new ApiResponse(200, data, "All attendance records fetched successfully"));
});