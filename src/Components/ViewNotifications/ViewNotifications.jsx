// ViewNotifications.jsx
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import supabase from "../../SupabaseClient";
import { userDataContext, sessionContext } from "../../AppContexts";
import { toast } from "react-toastify";
import { Bell, X, CheckCheck, Trash2, Calendar, User } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import "./ViewNotifications.css";

const ViewNotifications = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const { userData } = useContext(userDataContext);
  const { session } = useContext(sessionContext);
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
    // If no session, don't show any notifications
    if (!session) {
      return false;
    }

    // If it's a broadcast to all users
    if (notification.isAll) {
      return true;
    }

    // If it's a direct email notification - check against session user email
    if (notification.brokerEmail && session.user?.email) {
      return notification.brokerEmail === session.user.email;
    }

    // If it's a direct ID notification - check against userData if available
    if (notification.brokerIdTo && userData?.id) {
      return notification.brokerIdTo === userData.id;
    }

    // If it's a range notification - check against userData if available
    if (notification.brokerIdFrom && notification.brokerIdTo && userData?.id) {
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

    // If we have userData, use the broker ID
    if (userData?.id) {
      return notification.read_by[userData.id] === true;
    }

    // If we only have session, we can't track read status by ID
    // For now, we'll consider all notifications as unread for non-broker users
    return false;
  };

  // Mark notification as read in database
  const markAsRead = async (notification) => {
    if (isNotificationRead(notification)) return;

    // Only brokers can mark notifications as read (they have userData.id)
    if (!userData?.id) {
      // For non-broker users, we can't track read status
      return;
    }

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

      // Dispatch custom event to notify Header component
      const event = new CustomEvent("notificationRead", {
        detail: {
          notificationId: notification.id,
          userId: userData.id,
          timestamp: new Date().toISOString(),
        },
      });
      window.dispatchEvent(event);
      console.log("ViewNotifications: Dispatched notification read event");
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    // Only brokers can mark notifications as read (they have userData.id)
    if (!userData?.id) {
      // For non-broker users, we can't track read status
      return;
    }

    const unreadNotifications = filteredNotifications.filter(
      (n) => !isNotificationRead(n)
    );

    if (unreadNotifications.length === 0) {
      toast.info(t("notifications.allAlreadyRead"));
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

      toast.success(t("notifications.allMarkedAsRead"));

      // Dispatch custom event to notify Header component
      const event = new CustomEvent("notificationRead", {
        detail: {
          notificationIds: unreadNotifications.map((n) => n.id),
          userId: userData.id,
          timestamp: new Date().toISOString(),
          markAll: true,
        },
      });
      window.dispatchEvent(event);
      console.log("ViewNotifications: Dispatched mark all read event");
    } catch (error) {
      toast.error(t("notifications.failedToMarkAllAsRead"));
    }
  };

  // Check if notification can be deleted (only for single user notifications)
  const canDeleteNotification = (notification) => {
    // Only brokers can delete notifications (they have userData)
    if (!userData) return false;

    return (
      (notification.brokerEmail === userData.email ||
        notification.brokerIdTo === userData.id) &&
      !notification.isAll &&
      !notification.brokerIdFrom
    );
  };

  // Delete notification
  const deleteNotification = async (notification) => {
    if (!canDeleteNotification(notification)) {
      toast.error(t("notifications.canOnlyDeleteDirect"));
      return;
    }

    const { error } = await supabase
      .from("Notifications")
      .delete()
      .eq("id", notification.id);

    if (error) {
      toast.error(t("notifications.failedToDelete"));
    } else {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      toast.success(t("notifications.deleted"));
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

    if (diffMins < 1) return t("notifications.justNow");
    if (diffMins < 60) return `${diffMins} ${t("notifications.minutesAgo")}`;
    if (diffHours < 24) return `${diffHours} ${t("notifications.hoursAgo")}`;
    if (diffDays < 7) return `${diffDays} ${t("notifications.daysAgo")}`;

    return date.toLocaleDateString();
  };

  const getNotificationType = (notification) => {
    if (notification.isAll) return t("notifications.allUsers");
    if (notification.brokerEmail) return t("notifications.direct");
    if (notification.brokerIdTo && !notification.brokerIdFrom)
      return t("notifications.direct");
    if (notification.brokerIdFrom && notification.brokerIdTo)
      return t("notifications.group");
    return t("notifications.direct");
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
            toast.info(t("notifications.newNotificationReceived"));
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

  // Show loading state if session is not loaded yet
  if (!session) {
    return (
      <div className="notifications-container">
        <div className="notifications-header">
          <div className="header-left">
            <Bell size={24} className="bell-icon" />
            <h2 className="notifications-title">{t("notifications.title")}</h2>
          </div>
        </div>
        <div className="notifications-content">
          <div className="empty-state">
            <Bell size={48} className="empty-icon" />
            <p className="empty-text">{t("common.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <div className="header-left">
          <Bell size={24} className="bell-icon" />
          <h2 className="notifications-title">{t("notifications.title")}</h2>
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
        {filteredNotifications.length > 0 && userData?.id && (
          <button className="mark-all-btn" onClick={markAllAsRead}>
            <CheckCheck size={16} />
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      <div className="notifications-content">
        <div className="notifications-list-container">
          {filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} className="empty-icon" />
              <p className="empty-text">{t("notifications.noNotifications")}</p>
              <p className="empty-subtext">{t("notifications.allCaughtUp")}</p>
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
                        className="view-notifications-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification);
                        }}
                        title={t("notifications.deleteNotification")}
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
                className="view-notifications-close-btn"
                onClick={() => setSelectedNotification(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="preview-meta">
              <div className="meta-row">
                <User size={14} />
                <span className="meta-label">
                  {t("notifications.recipient")}:
                </span>
                <span className="meta-value">
                  {selectedNotification.isAll
                    ? t("notifications.allUsers")
                    : selectedNotification.brokerEmail
                    ? selectedNotification.brokerEmail
                    : `${t("notifications.brokers")} ${
                        selectedNotification.brokerIdFrom
                      } - ${selectedNotification.brokerIdTo}`}
                </span>
              </div>
            </div>

            <div className="preview-divider" />

            <div className="preview-message-container">
              <h4 className="preview-message-title">
                📦 {t("notifications.messagePreview")}:
              </h4>
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
            <p className="placeholder-text">
              {t("notifications.selectToView")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewNotifications;
