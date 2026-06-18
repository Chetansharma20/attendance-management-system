import { updateOvertimeStatusService, getPendingOvertimeService, requestOvertimeService, getMyRequestsService } from "../services/overtimerequestService.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requestOvertime = asyncHandler(
  async (req, res) => {
    const {
      attendanceId,
      requestedHours,
      reason,
    } = req.body;

    const overtime =
      await requestOvertimeService(
        req.user._id,
        attendanceId,
        requestedHours,
        reason
      );

    res.status(201).json(
    new ApiResponse(201, overtime, "Overtime request submitted successfully")
  );
  }
);

export const getPendingOvertime = asyncHandler(
  async (req, res) => {
    const requests = await getPendingOvertimeService(
      req.user._id,
      req.user.role
    );

    res.status(200).json(
      new ApiResponse(200, requests, "Pending overtime requests fetched successfully")
    );
  }   
)


export const updateOvertimeStatus = asyncHandler(
  async (req, res) => {
    const { requestId, status, rejectionReason } = req.body;

    const result = await updateOvertimeStatusService(
      requestId,
      req.user._id,
      req.user.role,
      status,
      rejectionReason
    );

    res.status(200).json(
      new ApiResponse(200, result, `Overtime request has been ${status} successfully`)
    );
  }
);

export const getMyRequests = asyncHandler(
  async (req, res) => {
    const requests = await getMyRequestsService(
      req.user._id
    );

    res.status(200).json(
      new ApiResponse(200, requests, "My overtime requests fetched successfully")
    );
  }
);