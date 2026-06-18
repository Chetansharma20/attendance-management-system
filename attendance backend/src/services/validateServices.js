import Attendance from "../models/attendance.js";
import { ApiError } from "../utils/ApiError.js";

export const validateAttendanceService = async (
  attendanceId,
  status,
  remarks,
  validatorId
) => {
  const attendance = await Attendance.findById(
    attendanceId
  );

  if (!attendance) {
    throw new ApiError(
      404,
      "Attendance not found"
    );
  }

  attendance.validation = {
    status,
    remarks,
    validatedBy: validatorId,
    validatedAt: new Date(),
  };

  await attendance.save();

  return attendance;
};