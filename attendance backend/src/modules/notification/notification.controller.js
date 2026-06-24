import { asyncHandler } from "../../utils/asyncHandler.js";
import { getMyNotificationsService, markAsReadService } from "./notification.service.js";

export const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await getMyNotificationsService(req.user._id);
  res.status(200).json({
    success: true,
    data: notifications,
  });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await markAsReadService(id, req.user._id);
  res.status(200).json({
    success: true,
    data: notification,
  });
});
