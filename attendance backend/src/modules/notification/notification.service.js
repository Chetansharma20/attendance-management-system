import Notification from "../../models/notification.js";
import User from "../../models/users.js";
import { getIO } from "../../config/socket.js";
import { ApiError } from "../../utils/ApiError.js";

/**
 * Creates a notification in DB and emits it to the user's socket room if online.
 */
export const createNotificationService = async ({ recipientId, title, message, type, referenceId }) => {
  const notification = await Notification.create({
    recipientId,
    title,
    message,
    type,
    referenceId,
  });

  try {
    const io = getIO();
    io.to(recipientId.toString()).emit("new_notification", notification);
  } catch (err) {
    console.error(`[Socket] Failed to emit notification to user ${recipientId}:`, err.message);
  }

  return notification;
};

/**
 * Helper to notify all admin users. Saves notification in DB for each admin and emits to 'admins' room.
 */
export const notifyAdminsService = async ({ title, message, type, referenceId }) => {
  const admins = await User.find({ role: "admin" }).select("_id");
  const notifications = [];

  for (const admin of admins) {
    const notification = await Notification.create({
      recipientId: admin._id,
      title,
      message,
      type,
      referenceId,
    });
    notifications.push(notification);
  }

  try {
    const io = getIO();
    // Emit notification to 'admins' room
    io.to("admins").emit("new_notification", {
      title,
      message,
      type,
      referenceId,
    });
  } catch (err) {
    console.error("[Socket] Failed to emit notification to admins room:", err.message);
  }

  return notifications;
};

/**
 * Fetch notifications for a user, sorted by newest first.
 */
export const getMyNotificationsService = async (userId) => {
  return await Notification.find({ recipientId: userId }).sort({ createdAt: -1 });
};

/**
 * Mark a specific notification as read.
 */
export const markAsReadService = async (notificationId, userId) => {
  const notification = await Notification.findOne({ _id: notificationId, recipientId: userId });
  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};
