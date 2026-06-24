import React, { useState, useRef, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext.jsx";
import { Bell, Inbox } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [, setSearchParams] = useSearchParams();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id).unwrap();
    }
    
    // Determine the target tab based on type and user role
    let targetTab = "";
    if (notif.type === "overtime_request" || notif.type === "overtime_status") {
      targetTab = "overtime";
    } else if (notif.type === "leave_request") {
      targetTab = user?.role === "admin" ? "leave" : "leaves";
    } else if (notif.type === "leave_status") {
      targetTab = "leaves";
    }

    if (targetTab) {
      setSearchParams({ tab: targetTab });
    }
    setIsOpen(false);
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    for (const notif of unread) {
      await markAsRead(notif._id).unwrap();
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-theme-card hover:bg-theme-card-hover border border-theme-border text-theme-muted hover:text-theme-bright transition-all duration-200 cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-theme-bg animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 max-h-[400px] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 flex flex-col transition-colors duration-200">
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-semibold cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-150 dark:divide-zinc-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 gap-2">
                <Inbox className="w-8 h-8 opacity-60" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 flex gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer transition-colors duration-150 ${
                    !notif.isRead ? "bg-violet-500/5" : ""
                  }`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{notif.title}</p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-violet-600 dark:bg-violet-400 rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">{notif.message}</p>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
