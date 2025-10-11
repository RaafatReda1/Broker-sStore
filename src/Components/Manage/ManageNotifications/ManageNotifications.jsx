import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import "./ManageNotifications.css";
import supabase from "../../../SupabaseClient";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const ManageNotifications = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [content, setContent] = useState("");
  const [sendType, setSendType] = useState("single"); // single, range, all
  const [singleIdentifier, setSingleIdentifier] = useState("");
  const [identifierType, setIdentifierType] = useState("id"); // id or email
  const [brokerIdFrom, setBrokerIdFrom] = useState("");
  const [brokerIdTo, setBrokerIdTo] = useState("");
  const [isTemp, setIsTemp] = useState(false);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  // Fetch sent notifications
  const fetchSentNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("Notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setSentNotifications(data || []);
    } catch (error) {
      console.error("Error fetching sent notifications:", error);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      const { error } = await supabase
        .from("Notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success(t("manageNotifications.notificationDeleted"));
      fetchSentNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error(t("manageNotifications.deleteFailed"));
    }
  };

  // Handle navigation state from broker deletion
  useEffect(() => {
    if (location.state) {
      const {
        brokerEmail,
        sendType: navSendType,
        identifierType: navIdentifierType,
      } = location.state;

      if (brokerEmail) {
        setSingleIdentifier(brokerEmail);
        setIdentifierType(navIdentifierType || "email");
        setSendType(navSendType || "single");

        // Show success message
        toast.success(`Pre-filled with broker email: ${brokerEmail}`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    }

    // Fetch sent notifications on component mount
    fetchSentNotifications();
  }, [location.state]);

  // Scroll detection for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      setShowScrollToTop(scrollTop > 300); // Show button after scrolling 300px
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleSendNotification = async () => {
    if (!content.trim()) {
      toast.error(t("manageNotifications.contentRequired"));
      return;
    }

    if (!title.trim()) {
      toast.error(t("manageNotifications.titleRequired"));
      return;
    }

    setIsLoading(true);

    try {
      let insertData = {
        msg: content,
        title: title,
        isTemp: isTemp,
        isAll: false,
        brokerIdFrom: null,
        brokerIdTo: null,
        brokerEmail: null,
      };

      if (sendType === "single") {
        if (!singleIdentifier.trim()) {
          toast.error(t("manageNotifications.identifierRequired"));
          setIsLoading(false);
          return;
        }

        if (identifierType === "id") {
          insertData.brokerIdTo = parseFloat(singleIdentifier);
        } else {
          insertData.brokerEmail = singleIdentifier;
        }
      } else if (sendType === "range") {
        if (!brokerIdFrom || !brokerIdTo) {
          toast.error(t("manageNotifications.rangeRequired"));
          setIsLoading(false);
          return;
        }

        insertData.brokerIdFrom = parseFloat(brokerIdFrom);
        insertData.brokerIdTo = parseFloat(brokerIdTo);
      } else if (sendType === "all") {
        insertData.isAll = true;
      }

      const { data, error } = await supabase
        .from("Notifications")
        .insert(insertData);

      if (error) {
        console.error("Error sending notification:", error);
        toast.error("Failed to send notification. Please try again.");
      } else {
        toast.success("Notification sent successfully! ✅");

        // Refresh notifications list
        await fetchSentNotifications();

        // Reset form
        setContent("");
        setTitle("");
        setIsTemp(false);
        setSingleIdentifier("");
        setBrokerIdFrom("");
        setBrokerIdTo("");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mainContainer">
        <div className="notification-wrapper">
          {/* Header */}
          <div className="notification-header">
            <div className="header-content">
              <h1>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
                {t("manageNotifications.title")}
              </h1>
              <p>{t("manageNotifications.subtitle")}</p>
            </div>
            <div className="header-actions">
              <button
                onClick={() => {
                  if (!showHistory) {
                    setTimeout(() => {
                      window.scrollTo({ top: 1000, behavior: "smooth" });
                    }, 500);
                  }
                  setShowHistory(!showHistory);
                }}
                className={`toggle-btn ${showHistory ? "active" : ""}`}
              >
                <span className="btn-icon">
                  {!showHistory
                    ? t("manageNotifications.showHistory")
                    : t("manageNotifications.hideHistory")}
                </span>
                <span className="btn-text">
                  {showHistory ? (
                    <FontAwesomeIcon icon={faEyeSlash} />
                  ) : (
                    <FontAwesomeIcon icon={faEye} />
                  )}
                </span>
              </button>
            </div>
          </div>

          <div className="notification-grid">
            {/* Left Panel - Send Options */}
            <div className="notification-card">
              <div className="card-header">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Recipients
              </div>

              {/* Send Type Selection */}
              <div className="send-type-container">
                <button
                  onClick={() => setSendType("single")}
                  className={`send-type-btn ${
                    sendType === "single" ? "active" : "inactive"
                  }`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <div className="send-type-content">
                    <div className="send-type-title">
                      {t("manageNotifications.singleBroker")}
                    </div>
                    <div className="send-type-desc">
                      {t("manageNotifications.sendToOneBroker")}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSendType("range")}
                  className={`send-type-btn ${
                    sendType === "range" ? "active" : "inactive"
                  }`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  <div className="send-type-content">
                    <div className="send-type-title">
                      {t("manageNotifications.idRange")}
                    </div>
                    <div className="send-type-desc">
                      {t("manageNotifications.sendToBrokerRange")}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSendType("all")}
                  className={`send-type-btn ${
                    sendType === "all" ? "active" : "inactive"
                  }`}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <div className="send-type-content">
                    <div className="send-type-title">
                      {t("manageNotifications.allBrokers")}
                    </div>
                    <div className="send-type-desc">
                      {t("manageNotifications.broadcastToEveryone")}
                    </div>
                  </div>
                </button>
              </div>

              {/* Conditional Input Fields */}
              {sendType === "single" && (
                <div>
                  <div className="input-group">
                    <label className="input-label">
                      {t("manageNotifications.identifyBy")}
                    </label>
                    <div className="identifier-toggle">
                      <button
                        onClick={() => setIdentifierType("id")}
                        className={`toggle-btn ${
                          identifierType === "id" ? "active" : "inactive"
                        }`}
                      >
                        ID
                      </button>
                      <button
                        onClick={() => setIdentifierType("email")}
                        className={`toggle-btn ${
                          identifierType === "email" ? "active" : "inactive"
                        }`}
                      >
                        Email
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">
                      {identifierType === "id"
                        ? t("manageNotifications.userID")
                        : t("manageNotifications.userEmail")}
                    </label>
                    <input
                      type={identifierType === "id" ? "number" : "email"}
                      value={singleIdentifier}
                      onChange={(e) => setSingleIdentifier(e.target.value)}
                      placeholder={
                        identifierType === "id"
                          ? t("manageNotifications.enterUserID")
                          : t("manageNotifications.enterUserEmail")
                      }
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              {sendType === "range" && (
                <div>
                  <div className="input-group">
                    <label className="input-label">From ID</label>
                    <input
                      type="number"
                      value={brokerIdFrom}
                      onChange={(e) => setBrokerIdFrom(e.target.value)}
                      placeholder={t("manageNotifications.startID")}
                      className="input-field"
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label">To ID</label>
                    <input
                      type="number"
                      value={brokerIdTo}
                      onChange={(e) => setBrokerIdTo(e.target.value)}
                      placeholder={t("manageNotifications.endID")}
                      className="input-field"
                    />
                  </div>
                </div>
              )}

              {sendType === "all" && (
                <div className="warning-box">
                  <p className="warning-text">
                    ⚠️ This will send the notification to all Brokers in the
                    system.
                  </p>
                </div>
              )}
            </div>

            {/* Right Panel - Editor */}
            <div className="notification-card">
              <div className="card-header">
                📝 {t("manageNotifications.notificationContent")}
              </div>

              {/* Message Title */}
              <div className="title-section">
                <label className="input-label">
                  {t("manageNotifications.messageTitle")}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("manageNotifications.enterMessageTitle")}
                  className="title-input"
                />
              </div>

              {/* Template Options */}
              <div className="template-section">
                <div className="template-option">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={isTemp}
                      onChange={(e) => setIsTemp(e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    {t("manageNotifications.saveAsTemplate")}
                  </label>
                </div>
              </div>

              <div className="editor-section">
                <div className="editor-wrapper">
                  <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || "")}
                    height={350}
                    data-color-mode="dark"
                    preview="edit"
                    hideToolbar={false}
                    visibleDragBar={false}
                    textareaProps={{
                      placeholder: t(
                        "manageNotifications.writeNotificationMessage"
                      ),
                      style: {
                        fontSize: 14,
                        fontFamily: "Arial, sans-serif",
                      },
                    }}
                  />
                </div>
              </div>

              {/* Preview */}
              {content && (
                <div className="preview-section">
                  <h3 className="preview-title">📦 Preview</h3>
                  <div className="preview-content">
                    <MDEditor.Markdown
                      source={content}
                      style={{
                        whiteSpace: "pre-wrap",
                        backgroundColor: "transparent",
                        color: "#e5e7eb",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendNotification}
                disabled={isLoading}
                className="send-button"
              >
                {isLoading ? (
                  <>
                    <div className="spinner" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="22" y1="2" x2="11" y2="13"></line>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                    {t("manageNotifications.sendNotification")}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Notification History Section */}
          {showHistory && (
            <div className="notification-history">
              <div className="history-header">
                <h2>📋 {t("manageNotifications.sentNotificationsHistory")}</h2>
                <p>{t("manageNotifications.viewAndManage")}</p>
              </div>

              <div className="history-content">
                {sentNotifications.length === 0 ? (
                  <div className="no-history">
                    <span className="no-history-icon">📭</span>
                    <p>{t("manageNotifications.noNotificationsSent")}</p>
                  </div>
                ) : (
                  <div className="notifications-list">
                    {sentNotifications.map((notification) => (
                      <div key={notification.id} className="notification-item">
                        <div className="notification-header-item">
                          <div className="notification-title">
                            <h3>{notification.title}</h3>
                            {notification.isTemp && (
                              <span className="temp-badge">Template</span>
                            )}
                          </div>
                          <div className="notification-meta">
                            <span className="notification-date">
                              {new Date(
                                notification.created_at
                              ).toLocaleString()}
                            </span>
                            <span className="notification-type">
                              {notification.isAll
                                ? t("manageNotifications.allBrokers")
                                : notification.brokerEmail
                                ? `To: ${notification.brokerEmail}`
                                : notification.brokerIdTo
                                ? `To ID: ${notification.brokerIdTo}`
                                : t("manageNotifications.range")}
                            </span>
                            <button
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                              className="notification-delete-btn"
                              title="Delete notification"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                        <div className="notification-content">
                          <MDEditor.Markdown
                            source={notification.msg}
                            style={{ backgroundColor: "transparent" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ManageNotifications;
