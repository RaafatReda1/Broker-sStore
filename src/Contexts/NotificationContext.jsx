import React, { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: "info",
      duration: 4000,
      ...notification,
    };

    console.log("Creating notification:", newNotification);
    setNotifications((prev) => {
      const updated = [...prev, newNotification];
      console.log("Updated notifications array:", updated);
      return updated;
    });

    // Auto remove after duration (only if duration > 0)
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Convenience methods
  const showSuccess = (title, message, duration = 4000) => {
    return showNotification({ type: "success", title, message, duration });
  };

  const showError = (title, message, duration = 6000) => {
    return showNotification({ type: "error", title, message, duration });
  };

  const showWarning = (title, message, duration = 5000) => {
    return showNotification({ type: "warning", title, message, duration });
  };

  const showInfo = (title, message, duration = 4000) => {
    return showNotification({ type: "info", title, message, duration });
  };

  const showLoading = (title, message, duration = 0) => {
    return showNotification({ type: "loading", title, message, duration });
  };

  const value = {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
