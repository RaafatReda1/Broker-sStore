import React, { useEffect, useState } from "react";
import "./Notification.css";

const Notification = ({
  type = "info",
  title,
  message,
  duration = 4000,
  onClose,
  show = false,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsAnimating(true);

      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      case "loading":
        return "⏳";
      default:
        return "ℹ️";
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case "success":
        return "notification-success";
      case "error":
        return "notification-error";
      case "warning":
        return "notification-warning";
      case "info":
        return "notification-info";
      case "loading":
        return "notification-loading";
      default:
        return "notification-info";
    }
  };

  console.log("Notification component rendering:", {
    isVisible,
    show,
    type,
    title,
    message,
  });

  if (!isVisible) return null;

  return (
    <div
      className={`notification-overlay ${
        isAnimating ? "notification-enter" : "notification-exit"
      }`}
    >
      <div className={`notification ${getTypeClass()}`}>
        <div className="notification-content">
          <div className="notification-icon">
            {type === "loading" ? (
              <div className="notification-spinner">⏳</div>
            ) : (
              getIcon()
            )}
          </div>
          <div className="notification-text">
            {title && <h4 className="notification-title">{title}</h4>}
            {message && <p className="notification-message">{message}</p>}
          </div>
          <button
            className="notification-close"
            onClick={handleClose}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
        <div className="notification-progress">
          <div
            className="notification-progress-bar"
            style={{
              animation: `notification-progress ${duration}ms linear forwards`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Notification;
