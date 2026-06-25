import Notification, { INotification } from "./notification.js";

export const createNotification = async (data: Partial<INotification>): Promise<INotification> => {
  return await Notification.create(data);
};

export const findNotificationsByRecipient = async (recipientId: string): Promise<INotification[]> => {
  return await Notification.find({ recipientId }).sort({ createdAt: -1 });
};

export const findNotificationByIdAndRecipient = async (
  id: string,
  recipientId: string
): Promise<INotification | null> => {
  return await Notification.findOne({ _id: id, recipientId });
};
