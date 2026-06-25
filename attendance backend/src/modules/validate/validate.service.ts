import { findAttendanceById } from "../attendance/attendance.repository.js";
import { ApiError } from "../../utils/ApiError.js";

export const validateAttendanceService = async (
  attendanceId: string,
  status: "pending" | "valid" | "invalid",
  remarks: string | undefined,
  validatorId: string
) => {
  const attendance = await findAttendanceById(attendanceId);
  if (!attendance) throw new ApiError(404, "Attendance not found");

  attendance.validation = {
    status,
    remarks: remarks || "",
    validatedBy: validatorId as any,
    validatedAt: new Date()
  };

  await attendance.save();
  return attendance;
};
