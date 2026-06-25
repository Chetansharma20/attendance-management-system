import { findAdmins } from "../user/user.repository.js";
import { getIO } from "../../sockets/socket.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  createNotification,
  findNotificationsByRecipient,
  findNotificationByIdAndRecipient,
} from "./notification.repository.js";

interface CreateNotificationParams {
  recipientId: any;
  title: string;
  message: string;
  type: "overtime_request" | "overtime_status" | "leave_request" | "leave_status";
  referenceId: any;
}

/**
 * Creates a notification in DB and emits it to the user's socket room if online.
 */
export const createNotificationService = async ({
  recipientId,
  title,
  message,
  type,
  referenceId,
}: CreateNotificationParams) => {
  const notification = await createNotification({
    recipientId,
    title,
    message,
    type,
    referenceId,
  });

  try {
    const io = getIO();
    io.to(recipientId.toString()).emit("new_notification", notification);
  } catch (err: any) {
    console.error(`[Socket] Failed to emit notification to user ${recipientId}:`, err.message);
  }

  return notification;
};

/**
 * Helper to notify all admin users. Saves notification in DB for each admin and emits to 'admins' room.
 */
export const notifyAdminsService = async ({
  title,
  message,
  type,
  referenceId,
}: Omit<CreateNotificationParams, "recipientId">) => {
  const admins = await findAdmins();
  const notifications = [];

  for (const admin of admins) {
    const notification = await createNotification({
      recipientId: admin._id as any,
      title,
      message,
      type,
      referenceId,
    });
    notifications.push(notification);
  }

  try {
    const io = getIO();
    io.to("admins").emit("new_notification", {
      title,
      message,
      type,
      referenceId,
    });
  } catch (err: any) {
    console.error("[Socket] Failed to emit notification to admins room:", err.message);
  }

  return notifications;
};

/**
 * Fetch notifications for a user, sorted by newest first.
 */
export const getMyNotificationsService = async (userId: string) => {
  return await findNotificationsByRecipient(userId);
};

/**
 * Mark a specific notification as read.
 */
export const markAsReadService = async (notificationId: string, userId: string) => {
  const notification = await findNotificationByIdAndRecipient(notificationId, userId);
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};
