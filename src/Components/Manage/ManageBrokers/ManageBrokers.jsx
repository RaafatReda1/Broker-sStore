import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import supabase from "../../../SupabaseClient";
import BrokerImageService from "../../../utils/brokerImageService";
import ViewImages from "./ViewImages/ViewImages";
import ViewStatistics from "./ViewStatistics/ViewStatistics";
import DeletePopup from "./DeletePopup/DeletePopup";
import "./ManageBrokers.css";

const ManageBrokers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [brokers, setBrokers] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [showImages, setShowImages] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tempMessages, setTempMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [deletedBroker, setDeletedBroker] = useState(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState(null);

  // 🔹 Fetch brokers from DB
  const fetchBrokers = async () => {
    const { data, error } = await supabase.from("Brokers").select("*");
    if (error) {
      console.error("Error fetching brokers:", error);
    } else if (data) {
      setBrokers(data);
      console.log("Fetched brokers:", data);
    }
  };

  // 🔹 Update verification status
  const updateVerificationStatus = async (brokerId, isVerified) => {
    try {
      // Get the broker data before updating
      const broker = brokers.find((b) => b.id === brokerId);
      const wasUnverified = !broker?.isVerified;

      const { error } = await supabase
        .from("Brokers")
        .update({ isVerified })
        .eq("id", brokerId);

      if (error) throw error;

      // ✅ Update the state locally without refetching everything
      setBrokers((prev) =>
        prev.map((b) => (b.id === brokerId ? { ...b, isVerified } : b))
      );

      // Send verification message if broker is being verified (was unverified, now verified)
      if (wasUnverified && isVerified) {
        await sendVerificationMessage(broker);
      }

      console.log("Verification status updated successfully");
    } catch (error) {
      console.error("Error updating verification status:", error);
    }
  };

  // 🔹 Send verification message to broker
  const sendVerificationMessage = async (broker) => {
    try {
      // Create verification message
      const verificationMessage = `
# 🎉 Congratulations! Your Account Has Been Verified

Dear **${broker.fullName}**,

We are pleased to inform you that your broker account has been successfully verified and is now active!

## ✅ What This Means:
- Your account is now fully functional
- You can start receiving orders
- All verification requirements have been met
- Your profile is now visible to customers

## 🚀 Next Steps:
- Complete your profile setup if you haven't already
- Upload any additional documents if required
- Start exploring the platform features
- Contact support if you have any questions

Thank you for your patience during the verification process. We look forward to working with you!

Best regards,  
The Cicada Team
      `;

      // Send notification to broker
      const { error: notificationError } = await supabase
        .from("Notifications")
        .insert({
          msg: verificationMessage,
          title: t("manageBrokers.accountVerificationSuccessful"),
          brokerEmail: broker.email,
          isAll: false,
          brokerIdFrom: null,
          brokerIdTo: null,
          isTemp: false,
        });

      if (notificationError) throw notificationError;

      // Show success toast
      toast.success(
        t("manageBrokers.verificationMessageSent", { name: broker.fullName }),
        {
          position: "top-right",
          autoClose: 3000,
        }
      );

      console.log("Verification message sent successfully");
    } catch (error) {
      console.error("Error sending verification message:", error);
      toast.error(t("manageBrokers.failedToSendVerificationMessage"));
    }
  };

  // 🔹 Fetch temp messages from Notifications table
  const fetchTempMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("Notifications")
        .select("*")
        .eq("isTemp", true);

      if (error) throw error;

      setTempMessages(data || []);
      console.log("Fetched temp messages:", data);
    } catch (error) {
      console.error("Error fetching temp messages:", error);
    }
  };

  // 🔹 Handle delete broker with temp message and image cleanup
  const handleDeleteBroker = async (brokerId, tempMessage) => {
    try {
      // Store broker data for potential undo
      const brokerToDelete = brokers.find((b) => b.id === brokerId);

      if (!brokerToDelete) {
        toast.error(t("manageBrokers.brokerNotFound"));
        return;
      }

      console.log(
        "🗑️ Starting broker deletion process for:",
        brokerToDelete.fullName
      );

      // Step 1: Delete all associated images
      console.log("📸 Deleting broker images...");
      const imageDeletionResult = await BrokerImageService.deleteBrokerImages(
        brokerToDelete
      );

      if (imageDeletionResult.success) {
        console.log(
          `✅ Successfully deleted ${imageDeletionResult.totalDeleted} images`
        );
        if (imageDeletionResult.totalDeleted > 0) {
          toast.success(
            `Deleted ${imageDeletionResult.totalDeleted} associated images`,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        }
      } else {
        console.warn(
          "⚠️ Some images could not be deleted:",
          imageDeletionResult.errors
        );
        toast.warning(
          `Deleted ${imageDeletionResult.totalDeleted} images, but ${imageDeletionResult.errors.length} failed`,
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      }

      // Step 2: Create notification with temp message
      console.log("📧 Creating notification...");
      const { error: notificationError } = await supabase
        .from("Notifications")
        .insert({
          msg: tempMessage.msg,
          title: tempMessage.title,
          brokerEmail: selectedBroker.email,
          isAll: false,
          brokerIdFrom: null,
          brokerIdTo: null,
        });

      if (notificationError) throw notificationError;

      // Step 3: Delete broker from database
      console.log("🗃️ Deleting broker from database...");
      const { error: deleteError } = await supabase
        .from("Brokers")
        .delete()
        .eq("id", brokerId);

      if (deleteError) throw deleteError;

      // Step 4: Update local state
      setBrokers((prev) => prev.filter((b) => b.id !== brokerId));

      // Step 5: Store deleted broker for undo (including image deletion info)
      setDeletedBroker({
        ...brokerToDelete,
        _imageDeletionResult: imageDeletionResult,
      });

      // Step 6: Close modal
      setShowDeleteModal(false);
      setSelectedBroker(null);

      // Step 7: Show undo toast
      showUndoToast(brokerToDelete);

      console.log("✅ Broker deletion completed successfully");
      toast.success(
        `${brokerToDelete.fullName} has been deleted successfully!`,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } catch (error) {
      console.error("❌ Error deleting broker:", error);
      toast.error("Failed to delete broker. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  // 🔹 Show undo toast notification
  const showUndoToast = (broker) => {
    // Clear any existing timeout
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }

    // Create custom toast with undo button
    const toastId = `undo-${broker.id}`;

    // Show the toast
    toast(
      <div className="undo-toast">
        <div className="undo-toast-content">
          <div className="undo-toast-icon">🗑️</div>
          <div className="undo-toast-text">
            <div className="undo-toast-title">Broker Deleted</div>
            <div className="undo-toast-message">
              {broker.fullName} has been deleted
            </div>
          </div>
        </div>
        <button
          className="undo-toast-button"
          onClick={() => handleUndoDelete(broker, toastId)}
        >
          Undo
        </button>
      </div>,
      {
        toastId: toastId,
        position: "top-right",
        autoClose: 8000,
        hideProgressBar: true,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        className: "undo-toast-container",
      }
    );

    // Set timeout to clear deleted broker data
    const timeoutId = setTimeout(() => {
      setDeletedBroker(null);
    }, 8000);

    setUndoTimeoutId(timeoutId);
  };

  // 🔹 Handle undo delete with image restoration warning
  const handleUndoDelete = async (broker, toastId) => {
    try {
      // Check if images were deleted
      const imageDeletionResult = broker._imageDeletionResult;
      const hasDeletedImages =
        imageDeletionResult && imageDeletionResult.totalDeleted > 0;

      // Show warning if images were deleted
      if (hasDeletedImages) {
        const confirmed = window.confirm(
          `⚠️ ${t("common.warning")}: ${imageDeletionResult.totalDeleted} ${t(
            "manageBrokers.imagesDeletedWarning"
          )}\n\n` +
            `${t("manageBrokers.restoreWarning")}\n\n` +
            `${t("manageBrokers.continueRestoration")}`
        );

        if (!confirmed) {
          toast.dismiss(toastId);
          return;
        }
      }

      // Restore broker to database
      const { error: restoreError } = await supabase
        .from("Brokers")
        .insert(broker);

      if (restoreError) throw restoreError;

      // Update local state
      setBrokers((prev) => [...prev, broker]);

      // Clear deleted broker data
      setDeletedBroker(null);

      // Clear timeout
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
        setUndoTimeoutId(null);
      }

      // Dismiss toast
      toast.dismiss(toastId);

      // Show success message with image warning if applicable
      const successMessage = hasDeletedImages
        ? `${broker.fullName} has been restored, but ${imageDeletionResult.totalDeleted} images remain deleted.`
        : `${broker.fullName} has been restored successfully!`;

      toast.success(successMessage, {
        position: "top-right",
        autoClose: hasDeletedImages ? 5000 : 3000,
      });

      console.log(
        "✅ Broker restored successfully",
        hasDeletedImages ? "(with image warning)" : ""
      );
    } catch (error) {
      console.error("❌ Error restoring broker:", error);
      toast.error("Failed to restore broker. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  // 🔹 Open delete modal
  const openDeleteModal = async (broker) => {
    setSelectedBroker(broker);
    await fetchTempMessages();
    setShowDeleteModal(true);
  };

  // 🔹 Navigate to notifications with broker email and delete broker with image cleanup
  const navigateToNotifications = async (brokerEmail) => {
    try {
      // Store broker data for potential undo
      const brokerToDelete = selectedBroker;

      if (!brokerToDelete) {
        toast.error(t("manageBrokers.brokerNotFound"));
        return;
      }

      console.log(
        "🗑️ Starting broker deletion process for:",
        brokerToDelete.fullName
      );

      // Step 1: Delete all associated images
      console.log("📸 Deleting broker images...");
      const imageDeletionResult = await BrokerImageService.deleteBrokerImages(
        brokerToDelete
      );

      if (imageDeletionResult.success) {
        console.log(
          `✅ Successfully deleted ${imageDeletionResult.totalDeleted} images`
        );
        if (imageDeletionResult.totalDeleted > 0) {
          toast.success(
            `Deleted ${imageDeletionResult.totalDeleted} associated images`,
            {
              position: "top-right",
              autoClose: 3000,
            }
          );
        }
      } else {
        console.warn(
          "⚠️ Some images could not be deleted:",
          imageDeletionResult.errors
        );
        toast.warning(
          `Deleted ${imageDeletionResult.totalDeleted} images, but ${imageDeletionResult.errors.length} failed`,
          {
            position: "top-right",
            autoClose: 5000,
          }
        );
      }

      // Step 2: Delete broker from database
      console.log("🗃️ Deleting broker from database...");
      const { error: deleteError } = await supabase
        .from("Brokers")
        .delete()
        .eq("id", selectedBroker.id);

      if (deleteError) throw deleteError;

      // Step 3: Update local state
      setBrokers((prev) => prev.filter((b) => b.id !== selectedBroker.id));

      // Step 4: Store deleted broker for undo (including image deletion info)
      setDeletedBroker({
        ...brokerToDelete,
        _imageDeletionResult: imageDeletionResult,
      });

      // Step 5: Close modal
      setShowDeleteModal(false);
      setSelectedBroker(null);

      // Step 6: Show undo toast
      showUndoToast(brokerToDelete);

      // Step 7: Navigate to notifications page
      navigate("/manageNotifications", {
        state: {
          brokerEmail: brokerEmail,
          sendType: "single",
          identifierType: "email",
        },
      });

      console.log(
        "✅ Broker deletion completed and navigating to notifications"
      );
      toast.success(
        `${brokerToDelete.fullName} has been deleted successfully!`,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } catch (error) {
      console.error("❌ Error deleting broker:", error);
      toast.error("Failed to delete broker. Please try again.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
      }
    };
  }, [undoTimeoutId]);

  // Filter brokers
  const filteredBrokers = brokers.filter((broker) => {
    const matchesSearch =
      broker.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.phone?.includes(searchTerm);

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "verified" && broker.isVerified) ||
      (filterStatus === "unverified" && !broker.isVerified);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="manage-brokers-container">
      <div className="header-section">
        <h1 className="page-title">
          <span className="title-icon">👥</span>
          {t("manageBrokers.title")}
        </h1>
        <div className="broker-stats">
          <div className="stat-badge">
            <span className="stat-label">{t("manageBrokers.total")}</span>
            <span className="stat-value">{brokers.length}</span>
          </div>
          <div className="stat-badge verified">
            <span className="stat-label">{t("manageBrokers.verified")}</span>
            <span className="stat-value">
              {brokers.filter((b) => b.isVerified).length}
            </span>
          </div>
          <div className="stat-badge unverified">
            <span className="stat-label">{t("manageBrokers.pending")}</span>
            <span className="stat-value">
              {brokers.filter((b) => !b.isVerified).length}
            </span>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t("manageBrokers.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={
              filterStatus === "all" ? "filter-btn active" : "filter-btn"
            }
            onClick={() => setFilterStatus("all")}
          >
            {t("manageBrokers.all")}
          </button>
          <button
            className={
              filterStatus === "verified" ? "filter-btn active" : "filter-btn"
            }
            onClick={() => setFilterStatus("verified")}
          >
            {t("manageBrokers.verified")}
          </button>
          <button
            className={
              filterStatus === "unverified" ? "filter-btn active" : "filter-btn"
            }
            onClick={() => setFilterStatus("unverified")}
          >
            {t("manageBrokers.pending")}
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="brokers-table">
          <thead>
            <tr>
              <th>{t("manageBrokers.id")}</th>
              <th>{t("manageBrokers.broker")}</th>
              <th>{t("manageBrokers.contact")}</th>
              <th>{t("manageBrokers.status")}</th>
              <th>{t("manageBrokers.actions")}</th>
            </tr>
          </thead>

          <tbody>
            {filteredBrokers.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-results">
                  <span className="no-results-icon">🔍</span>
                  <p>{t("manageBrokers.noBrokersFound")}</p>
                </td>
              </tr>
            ) : (
              filteredBrokers.map((broker) => (
                <tr key={broker.id} className="broker-row">
                  <td className="id-cell">#{broker.id}</td>

                  <td className="broker-cell">
                    <div className="broker-info">
                      <div className="avatar-wrapper">
                        {broker.avatar_url ? (
                          <img
                            src={broker.avatar_url}
                            alt="Avatar"
                            className="broker-avatar"
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {broker.fullName?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <span className="broker-name">{broker.fullName}</span>
                    </div>
                  </td>

                  <td className="contact-cell">
                    <div className="contact-info">
                      <span className="contact-item">
                        <span className="contact-icon">📧</span>
                        {broker.email}
                      </span>
                      <span className="contact-item">
                        <span className="contact-icon">📱</span>
                        {broker.phone}
                      </span>
                    </div>
                  </td>

                  <td className="status-cell">
                    <button
                      onClick={() =>
                        updateVerificationStatus(broker.id, !broker.isVerified)
                      }
                      className={
                        broker.isVerified
                          ? "status-btn verified"
                          : "status-btn unverified"
                      }
                    >
                      <span className="status-icon">
                        {broker.isVerified ? "✓" : "⏳"}
                      </span>
                      {broker.isVerified
                        ? t("manageBrokers.verified")
                        : t("manageBrokers.pending")}
                    </button>
                  </td>

                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        onClick={() => {
                          setSelectedBroker(broker);
                          setShowImages(true);
                        }}
                        className="action-btn images-btn"
                        title={t("manageBrokers.viewImages")}
                      >
                        <span className="btn-icon">🖼️</span>
                        <span className="btn-text">
                          {t("manageBrokers.images")}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBroker(broker);
                          setShowStatistics(true);
                        }}
                        className="action-btn stats-btn"
                        title={t("manageBrokers.viewStatistics")}
                      >
                        <span className="btn-icon">📊</span>
                        <span className="btn-text">
                          {t("manageBrokers.stats")}
                        </span>
                      </button>

                      <button
                        onClick={() => openDeleteModal(broker)}
                        className="action-btn brokers-delete-btn"
                        title={t("manageBrokers.deleteBroker")}
                      >
                        <span className="btn-icon">🗑️</span>
                        <span className="btn-text">
                          {t("manageBrokers.delete")}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Popup Components */}
      {showImages && selectedBroker && (
        <ViewImages
          broker={selectedBroker}
          onClose={() => setSelectedBroker(null)}
          show={{ showImages, setShowImages }}
        />
      )}

      {showStatistics && selectedBroker && (
        <ViewStatistics
          broker={selectedBroker}
          onClose={() => setSelectedBroker(null)}
          show={{ showStatistics, setShowStatistics }}
        />
      )}

      {/* Delete Broker Modal */}
      <DeletePopup
        showModal={showDeleteModal}
        selectedBroker={selectedBroker}
        tempMessages={tempMessages}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedBroker(null);
        }}
        onDeleteBroker={handleDeleteBroker}
        onNavigateToNotifications={navigateToNotifications}
      />
    </div>
  );
};

export default ManageBrokers;
