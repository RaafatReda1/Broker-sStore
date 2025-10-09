import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import supabase from "../../../SupabaseClient";
import ViewImages from "./ViewImages/ViewImages";
import ViewStatistics from "./ViewStatistics/ViewStatistics";
import DeletePopup from "./DeletePopup/DeletePopup";
import "./ManageBrokers.css";

const ManageBrokers = () => {
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
          title: "Account Verification Successful",
          brokerEmail: broker.email,
          isAll: false,
          brokerIdFrom: null,
          brokerIdTo: null,
          isTemp: false,
        });

      if (notificationError) throw notificationError;

      // Show success toast
      toast.success(`Verification message sent to ${broker.fullName}`, {
        position: "top-right",
        autoClose: 3000,
      });

      console.log("Verification message sent successfully");
    } catch (error) {
      console.error("Error sending verification message:", error);
      toast.error("Failed to send verification message");
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

  // 🔹 Handle delete broker with temp message
  const handleDeleteBroker = async (brokerId, tempMessage) => {
    try {
      // Store broker data for potential undo
      const brokerToDelete = brokers.find((b) => b.id === brokerId);

      // Create notification with temp message
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

      // Delete broker
      const { error: deleteError } = await supabase
        .from("Brokers")
        .delete()
        .eq("id", brokerId);

      if (deleteError) throw deleteError;

      // Update local state
      setBrokers((prev) => prev.filter((b) => b.id !== brokerId));

      // Store deleted broker for undo
      setDeletedBroker(brokerToDelete);

      // Close modal
      setShowDeleteModal(false);
      setSelectedBroker(null);

      // Show undo toast
      showUndoToast(brokerToDelete);

      console.log("Broker deleted and notification sent successfully");
    } catch (error) {
      console.error("Error deleting broker:", error);
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

  // 🔹 Handle undo delete
  const handleUndoDelete = async (broker, toastId) => {
    try {
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

      // Show success message
      toast.success(`${broker.fullName} has been restored successfully!`, {
        position: "top-right",
        autoClose: 3000,
      });

      console.log("Broker restored successfully");
    } catch (error) {
      console.error("Error restoring broker:", error);
      toast.error("Failed to restore broker. Please try again.");
    }
  };

  // 🔹 Open delete modal
  const openDeleteModal = async (broker) => {
    setSelectedBroker(broker);
    await fetchTempMessages();
    setShowDeleteModal(true);
  };

  // 🔹 Navigate to notifications with broker email and delete broker
  const navigateToNotifications = async (brokerEmail) => {
    try {
      // Store broker data for potential undo
      const brokerToDelete = selectedBroker;

      // Delete broker from database
      const { error: deleteError } = await supabase
        .from("Brokers")
        .delete()
        .eq("id", selectedBroker.id);

      if (deleteError) throw deleteError;

      // Update local state
      setBrokers((prev) => prev.filter((b) => b.id !== selectedBroker.id));

      // Store deleted broker for undo
      setDeletedBroker(brokerToDelete);

      // Close modal
      setShowDeleteModal(false);
      setSelectedBroker(null);

      // Show undo toast
      showUndoToast(brokerToDelete);

      // Navigate to notifications page
      navigate("/manageNotifications", {
        state: {
          brokerEmail: brokerEmail,
          sendType: "single",
          identifierType: "email",
        },
      });

      console.log("Broker deleted and navigating to notifications");
    } catch (error) {
      console.error("Error deleting broker:", error);
      toast.error("Failed to delete broker. Please try again.");
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
          Manage Brokers
        </h1>
        <div className="broker-stats">
          <div className="stat-badge">
            <span className="stat-label">Total</span>
            <span className="stat-value">{brokers.length}</span>
          </div>
          <div className="stat-badge verified">
            <span className="stat-label">Verified</span>
            <span className="stat-value">
              {brokers.filter((b) => b.isVerified).length}
            </span>
          </div>
          <div className="stat-badge unverified">
            <span className="stat-label">Pending</span>
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
            placeholder="Search by name, email, or phone..."
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
            All
          </button>
          <button
            className={
              filterStatus === "verified" ? "filter-btn active" : "filter-btn"
            }
            onClick={() => setFilterStatus("verified")}
          >
            Verified
          </button>
          <button
            className={
              filterStatus === "unverified" ? "filter-btn active" : "filter-btn"
            }
            onClick={() => setFilterStatus("unverified")}
          >
            Pending
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="brokers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Broker</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredBrokers.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-results">
                  <span className="no-results-icon">🔍</span>
                  <p>No brokers found</p>
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
                      {broker.isVerified ? "Verified" : "Pending"}
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
                        title="View ID Images"
                      >
                        <span className="btn-icon">🖼️</span>
                        <span className="btn-text">Images</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBroker(broker);
                          setShowStatistics(true);
                        }}
                        className="action-btn stats-btn"
                        title="View Statistics"
                      >
                        <span className="btn-icon">📊</span>
                        <span className="btn-text">Stats</span>
                      </button>

                      <button
                        onClick={() => openDeleteModal(broker)}
                        className="action-btn brokers-delete-btn"
                        title="Delete Broker"
                      >
                        <span className="btn-icon">🗑️</span>
                        <span className="btn-text">Delete</span>
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
