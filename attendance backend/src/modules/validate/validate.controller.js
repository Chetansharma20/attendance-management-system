import { validateAttendanceService } from "./validate.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export const validateAttendance = asyncHandler(async (req, res) => {
  const { status, remarks } = req.body;
  const attendance = await validateAttendanceService(req.params.attendanceId, status, remarks, req.user._id);
  res.status(200).json(new ApiResponse(200, attendance, "Attendance validated successfully"));
});
