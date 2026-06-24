import React, { createContext, useContext, useEffect, useState } from "react";
import { useSocket } from "./SocketContext.jsx";
import { useGetMyNotificationsQuery, useMarkAsReadMutation } from "../redux/api/notificationApi.js";
import { useSelector } from "react-redux";
import { Bell, X } from "lucide-react";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const token = useSelector((state) => state.auth.accessToken);
  const socket = useSocket();
  const [activeToast, setActiveToast] = useState(null);

  const { data: notificationsResponse, refetch } = useGetMyNotificationsQuery(undefined, {
    skip: !token,
  });

  const [markAsRead] = useMarkAsReadMutation();

  const notifications = notificationsResponse?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Request permission for native browser notifications when logged in
  useEffect(() => {
    if (token && typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, [token]);

  useEffect(() => {
    if (!socket || !token) return;

    const handleNewNotification = (notification) => {
      refetch();
      setActiveToast(notification);

      // Trigger native browser notification
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(notification.title, {
            body: notification.message,
          });
        } catch (err) {
          console.error("[Socket] Failed to show browser notification:", err);
        }
      }
    };

    socket.on("new_notification", handleNewNotification);

    return () => {
      socket.off("new_notification", handleNewNotification);
    };
  }, [socket, token, refetch]);

  // Automatically clear active toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, refetch }}>
      {children}
      
      {/* Global Toast Alert Overlay */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-4 flex gap-3 animate-bounce-in transition-all duration-300">
          <div className="p-2 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl self-start">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{activeToast.title}</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{activeToast.message}</p>
          </div>
          <button 
            onClick={() => setActiveToast(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 self-start transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
