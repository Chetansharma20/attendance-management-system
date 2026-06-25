import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getMyNotificationsService, markAsReadService } from "./notification.service.js";

export const getMyNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await getMyNotificationsService((req as any).user._id);
  res.status(200).json({
    success: true,
    data: notifications,
  });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const notification = await markAsReadService(id as string, (req as any).user._id);
  res.status(200).json({
    success: true,
    data: notification,
  });
});
