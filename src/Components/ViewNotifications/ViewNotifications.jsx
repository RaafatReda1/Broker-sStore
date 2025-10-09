// ViewNotifications.jsx
import React, { useContext, useEffect, useState } from "react";
import supabase from "../../SupabaseClient";
import { userDataContext } from "../../AppContexts";
import { toast } from "react-toastify";
import { Bell, X, CheckCheck, Trash2, Calendar, User } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import "./ViewNotifications.css";

const ViewNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const { userData } = useContext(userDataContext);
  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("Notifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
    } else if (data && data.length > 0) {
      setNotifications(data);
    }
  };

  // Filter notifications based on user eligibility
  const filteredNotifications = notifications.filter((notification) => {
    // If it's a broadcast to all users
    if (notification.isAll) {
      return true;
    }

    // If it's a direct email notification
    if (notification.brokerEmail && userData.email) {
      return notification.brokerEmail === userData.email;
    }

    // If it's a direct ID notification
    if (notification.brokerIdTo && userData.id) {
      return notification.brokerIdTo === userData.id;
    }

    // If it's a range notification
    if (notification.brokerIdFrom && notification.brokerIdTo && userData.id) {
      return (
        userData.id >= notification.brokerIdFrom &&
        userData.id <= notification.brokerIdTo
      );
    }

    // If no specific targeting, don't show
    return false;
  });

  // Check if notification is read by current user
  const isNotificationRead = (notification) => {
    if (!notification.read_by) return false;
    return notification.read_by[userData.id] === true;
  };

  // Mark notification as read in database
  const markAsRead = async (notification) => {
    if (isNotificationRead(notification)) return;

    const updatedReadBy = {
      ...(notification.read_by || {}),
      [userData.id]: true,
    };

    const { error } = await supabase
      .from("Notifications")
      .update({ read_by: updatedReadBy })
      .eq("id", notification.id);

    if (error) {
      console.error("Error marking as read:", error);
    } else {
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_by: updatedReadBy } : n
        )
      );
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unreadNotifications = filteredNotifications.filter(
      (n) => !isNotificationRead(n)
    );

    if (unreadNotifications.length === 0) {
      toast.info("All notifications are already read");
      return;
    }

    try {
      for (const notification of unreadNotifications) {
        const updatedReadBy = {
          ...(notification.read_by || {}),
          [userData.id]: true,
        };

        await supabase
          .from("Notifications")
          .update({ read_by: updatedReadBy })
          .eq("id", notification.id);
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => {
          if (unreadNotifications.find((un) => un.id === n.id)) {
            return {
              ...n,
              read_by: { ...(n.read_by || {}), [userData.id]: true },
            };
          }
          return n;
        })
      );

      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  // Check if notification can be deleted (only for single user notifications)
  const canDeleteNotification = (notification) => {
    return (
      notification.brokerEmail === userData.email &&
      !notification.isAll &&
      !notification.brokerIdFrom &&
      !notification.brokerIdTo
    );
  };

  // Delete notification
  const deleteNotification = async (notification) => {
    if (!canDeleteNotification(notification)) {
      toast.error("You can only delete notifications sent directly to you");
      return;
    }

    const { error } = await supabase
      .from("Notifications")
      .delete()
      .eq("id", notification.id);

    if (error) {
      toast.error("Failed to delete notification");
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      toast.success("Notification deleted");
      if (selectedNotification?.id === notification.id) {
        setSelectedNotification(null);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getNotificationType = (notification) => {
    if (notification.isAll) return "All Users";
    if (notification.brokerEmail) return "Direct";
    return "Group";
  };

  useEffect(() => {
    fetchNotifications();

    // Set up real-time subscription for notifications
    const notificationsSubscription = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notifications",
        },
        (payload) => {
          console.log("Real-time notification update:", payload);

          if (payload.eventType === "INSERT") {
            // New notification added
            setNotifications((prev) => [payload.new, ...prev]);
            toast.info("New notification received!");
          } else if (payload.eventType === "UPDATE") {
            // Notification updated (e.g., read status)
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? payload.new : n))
            );
          } else if (payload.eventType === "DELETE") {
            // Notification deleted
            setNotifications((prev) =>
              prev.filter((n) => n.id !== payload.old.id)
            );
            // Close preview if deleted notification was selected
            if (selectedNotification?.id === payload.old.id) {
              setSelectedNotification(null);
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  }, [selectedNotification]);

  const unreadCount = filteredNotifications.filter(
    (n) => !isNotificationRead(n)
  ).length;

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="header-left">
          <Bell size={24} className="bell-icon" />
          <h2 className="notifications-title">Notifications</h2>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        {filteredNotifications.length > 0 && (
          <button className="mark-all-btn" onClick={markAllAsRead}>
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      <div className="notifications-content">
        <div className="notifications-list-container">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} className="empty-icon" />
              <p className="empty-text">No notifications yet</p>
              <p className="empty-subtext">You&apos;re all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const isRead = isNotificationRead(notification);
              const isSelected = selectedNotification?.id === notification.id;
              const canDelete = canDeleteNotification(notification);

              return (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    isSelected ? "selected" : ""
                  } ${isRead ? "read" : ""}`}
                  onClick={() => {
                    setSelectedNotification(notification);
                    markAsRead(notification);
                  }}
                >
                  <div className="notification-header">
                    <div className="notification-header-left">
                      {!isRead && <div className="unread-dot" />}
                      <h4 className="notification-title">
                        {notification.title}
                      </h4>
                    </div>
                    {canDelete && (
                      <button
                        className="delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification);
                        }}
                        title="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div className="notification-meta">
                    <span className="meta-item">
                      <Calendar size={12} />
                      {formatDate(notification.created_at)}
                    </span>
                    <span
                      className={`type-badge ${
                        notification.isAll
                          ? "all"
                          : notification.brokerEmail
                          ? "direct"
                          : "group"
                      }`}
                    >
                      {getNotificationType(notification)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedNotification && (
          <div className="preview-container">
            <div className="preview-header">
              <div>
                <h3 className="preview-title">{selectedNotification.title}</h3>
                <p className="preview-date">
                  {new Date(selectedNotification.created_at).toLocaleString()}
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => setSelectedNotification(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="preview-meta">
              <div className="meta-row">
                <User size={14} />
                <span className="meta-label">Recipient:</span>
                <span className="meta-value">
                  {selectedNotification.isAll
                    ? "All Users"
                    : selectedNotification.brokerEmail
                    ? selectedNotification.brokerEmail
                    : `Brokers ${selectedNotification.brokerIdFrom} - ${selectedNotification.brokerIdTo}`}
                </span>
              </div>
            </div>

            <div className="preview-divider" />

            <div className="preview-message-container">
              <h4 className="preview-message-title">📦 Message Preview:</h4>
              <div className="preview-content">
                <MDEditor.Markdown
                  source={selectedNotification.msg}
                  style={{
                    whiteSpace: "pre-wrap",
                    backgroundColor: "transparent",
                    color: "#e5e7eb",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {!selectedNotification && filteredNotifications.length > 0 && (
          <div className="placeholder-container">
            <Bell size={64} className="placeholder-icon" />
            <p className="placeholder-text">Select a notification to view</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewNotifications;