import React, { useState, useEffect } from "react";
import "./ManageWithDrawal.css";
import supabase from "../../../SupabaseClient";
import { toast } from "react-toastify";
import ConfirmationModal from "../../ConfirmationModal/ConfirmationModal";

const ManageWithDrawal = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [brokerData, setBrokerData] = useState(null);
  const [brokerOrders, setBrokerOrders] = useState([]);
  const [deletedOrders, setDeletedOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // pending or finished
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [finishedCount, setFinishedCount] = useState(0);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
    onConfirm: null,
    confirmText: "Confirm",
    cancelText: "Cancel",
  });

  // Fetch withdrawal requests
  useEffect(() => {
    fetchWithdrawalRequests();
    fetchRequestCounts();
  }, [activeTab]);

  // Filter requests based on search
  useEffect(() => {
    filterRequests();
  }, [searchQuery, withdrawalRequests]);

  const fetchWithdrawalRequests = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("WithDrawalRequests")
        .select("*")
        .eq("Status", activeTab === "finished")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWithdrawalRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error(
        "❌ Couldn't load withdrawal requests. Please refresh the page."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRequestCounts = async () => {
    try {
      // Fetch pending count
      const { count: pendingCountData, error: pendingError } = await supabase
        .from("WithDrawalRequests")
        .select("*", { count: "exact", head: true })
        .eq("Status", false);

      if (pendingError) throw pendingError;
      setPendingCount(pendingCountData || 0);

      // Fetch finished count
      const { count: finishedCountData, error: finishedError } = await supabase
        .from("WithDrawalRequests")
        .select("*", { count: "exact", head: true })
        .eq("Status", true);

      if (finishedError) throw finishedError;
      setFinishedCount(finishedCountData || 0);
    } catch (error) {
      console.error("Error fetching request counts:", error);
    }
  };

  const filterRequests = () => {
    if (!searchQuery.trim()) {
      setFilteredRequests(withdrawalRequests);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = withdrawalRequests.filter(
      (req) =>
        req.brokerName.toLowerCase().includes(query) ||
        req.brokerEmail.toLowerCase().includes(query) ||
        req.brokerPhone.toLowerCase().includes(query) ||
        req.withDrawalPhone?.toLowerCase().includes(query) ||
        req.vodaCarrierName?.toLowerCase().includes(query) ||
        req.instaEmail?.toLowerCase().includes(query) ||
        req.instaAccountName?.toLowerCase().includes(query)
    );
    setFilteredRequests(filtered);
  };

  const handleRequestClick = async (request) => {
    setSelectedRequest(request);
    setIsLoading(true);

    try {
      // Fetch broker data
      const { data: broker, error: brokerError } = await supabase
        .from("Brokers")
        .select("*")
        .eq("id", request.brokerId)
        .single();

      if (brokerError) throw brokerError;
      setBrokerData(broker);

      if (activeTab === "pending") {
        // Fetch completed orders for pending requests
        const { data: orders, error: ordersError } = await supabase
          .from("Orders")
          .select("*")
          .eq("brokerId", request.brokerId)
          .eq("status", true)
          .order("created_at", { ascending: false });

        if (ordersError) throw ordersError;
        setBrokerOrders(orders || []);
        setDeletedOrders([]);
      } else {
        // Fetch deleted orders for finished requests
        const { data: delOrders, error: delOrdersError } = await supabase
          .from("DeletedOrders")
          .select("*")
          .eq("brokerId", request.brokerId)
          .order("created_at", { ascending: false });

        if (delOrdersError) throw delOrdersError;
        setDeletedOrders(delOrders || []);
        setBrokerOrders([]);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("❌ Couldn't load broker details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishRequest = async (request) => {
    showConfirmationModal({
      title: "Complete Withdrawal Request",
      message:
        "✨ Ready to complete this withdrawal?\n\n📋 This will:\n• Mark the request as finished\n• Archive all completed orders\n• Process the broker's payment\n\n💡 Don't worry - archived orders can be restored if needed!",
      type: "success",
      confirmText: "Complete Withdrawal",
      cancelText: "Keep Pending",
      onConfirm: async () => {
        await processFinishRequest(request);
      },
    });
  };

  const processFinishRequest = async (request) => {
    setIsProcessing(true);

    try {
      // 1. Fetch completed orders
      const { data: completedOrders, error: fetchError } = await supabase
        .from("Orders")
        .select("*")
        .eq("brokerId", request.brokerId)
        .eq("status", true);

      if (fetchError) throw fetchError;

      if (completedOrders && completedOrders.length > 0) {
        // 2. Copy orders to DeletedOrders table
        const ordersToDelete = completedOrders.map((order) => ({
          name: order.name,
          phone: order.phone,
          address: order.address,
          cart: order.cart,
          total: order.total,
          notes: order.notes,
          brokerId: order.brokerId,
          status: order.status,
          netProfit: order.netProfit,
          created_at: order.created_at,
        }));

        const { error: insertError } = await supabase
          .from("DeletedOrders")
          .insert(ordersToDelete);

        if (insertError) throw insertError;

        // 3. Delete orders from Orders table
        const orderIds = completedOrders.map((order) => order.id);
        const { error: deleteError } = await supabase
          .from("Orders")
          .delete()
          .in("id", orderIds);

        if (deleteError) throw deleteError;
      }

      // 4. Update withdrawal request status to finished
      const { error: updateError } = await supabase
        .from("WithDrawalRequests")
        .update({ Status: true })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // 5. Send notification to broker about successful withdrawal
      await sendWithdrawalNotification(request, completedOrders?.length || 0);

      toast.success(
        `🎉 Withdrawal completed successfully!\n` +
          `📦 ${completedOrders?.length || 0} orders archived\n` +
          `💰 Broker payment processed\n` +
          `📱 Notification sent to broker`
      );
      fetchWithdrawalRequests();
      fetchRequestCounts();
      setSelectedRequest(null);
      setBrokerData(null);
      setBrokerOrders([]);
    } catch (error) {
      console.error("Error finishing request:", error);
      toast.error(
        "❌ Oops! Couldn't complete the withdrawal. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetToPending = async (request) => {
    showConfirmationModal({
      title: "Restore Request to Pending",
      message:
        "🔄 Ready to restore this request?\n\n📋 This will:\n• Move the request back to pending\n• Restore all archived orders\n• Make orders active again\n\n💡 This is reversible - you can finish it again later!",
      type: "info",
      confirmText: "Restore Request",
      cancelText: "Keep Finished",
      onConfirm: async () => {
        await processResetRequest(request);
      },
    });
  };

  const processResetRequest = async (request) => {
    setIsProcessing(true);

    try {
      // 1. Fetch archived orders for this broker
      const { data: archivedOrders, error: fetchError } = await supabase
        .from("DeletedOrders")
        .select("*")
        .eq("brokerId", request.brokerId);

      if (fetchError) throw fetchError;

      if (archivedOrders && archivedOrders.length > 0) {
        // 2. Copy orders back to Orders table
        const ordersToRestore = archivedOrders.map((order) => ({
          name: order.name,
          phone: order.phone,
          address: order.address,
          cart: order.cart,
          total: order.total,
          notes: order.notes,
          brokerId: order.brokerId,
          status: order.status,
          netProfit: order.netProfit,
          created_at: order.created_at,
        }));

        const { error: insertError } = await supabase
          .from("Orders")
          .insert(ordersToRestore);

        if (insertError) throw insertError;

        // 3. Delete orders from DeletedOrders table
        const orderIds = archivedOrders.map((order) => order.id);
        const { error: deleteError } = await supabase
          .from("DeletedOrders")
          .delete()
          .in("id", orderIds);

        if (deleteError) throw deleteError;
      }

      // 4. Update withdrawal request status to pending
      const { error: updateError } = await supabase
        .from("WithDrawalRequests")
        .update({ Status: false })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // 5. Send notification to broker about request reset
      await sendResetNotification(request, archivedOrders?.length || 0);

      toast.success(
        `🔄 Request restored to pending!\n` +
          `📦 ${archivedOrders?.length || 0} orders reactivated\n` +
          `✨ Ready for processing again\n` +
          `📱 Notification sent to broker`
      );
      fetchWithdrawalRequests();
      fetchRequestCounts();
      setSelectedRequest(null);
      setBrokerData(null);
      setDeletedOrders([]);
    } catch (error) {
      console.error("Error resetting request:", error);
      toast.error("❌ Oops! Couldn't restore the request. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setBrokerData(null);
    setBrokerOrders([]);
    setDeletedOrders([]);
  };

  const calculateTotalRevenue = (orders) => {
    return orders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
  };

  const calculateTotalProfit = (orders) => {
    return orders.reduce(
      (sum, order) => sum + parseFloat(order.netProfit || 0),
      0
    );
  };

  const showConfirmationModal = (config) => {
    setConfirmationModal({
      isOpen: true,
      ...config,
    });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal((prev) => ({
      ...prev,
      isOpen: false,
    }));
  };

  const handleModalConfirm = async () => {
    if (confirmationModal.onConfirm) {
      await confirmationModal.onConfirm();
    }
    closeConfirmationModal();
  };

  const sendWithdrawalNotification = async (request, ordersCount) => {
    try {
      console.log(
        "Sending withdrawal notification for broker ID:",
        request.brokerId,
        "Type:",
        typeof request.brokerId
      );

      const notificationData = {
        title: "💰 Withdrawal Processed Successfully!",
        msg:
          `🎉 Great news! Your withdrawal request has been processed successfully.\n\n` +
          `📊 **Details:**\n` +
          `• **Amount:** ${parseFloat(request.actualBalance).toLocaleString(
            "en-US",
            {
              style: "currency",
              currency: "EGP",
            }
          )}\n` +
          `• **Orders Processed:** ${ordersCount} completed orders\n` +
          `• **Status:** ✅ Completed\n\n` +
          `💳 **Payment Method:**\n` +
          `${
            request.isVodafone
              ? `📱 Vodafone Cash: ${request.vodaCarrierName}`
              : ""
          }` +
          `${
            request.isInstaPay
              ? `💳 InstaPay: ${request.instaEmail || request.instaAccountName}`
              : ""
          }\n\n` +
          `📱 **Withdrawal Phone:** ${request.withDrawalPhone}\n\n` +
          `✨ Your payment should arrive shortly. Thank you for your business!\n\n` +
          `📞 If you have any questions, please contact our support team.`,
        isTemp: false,
        isAll: false,
        brokerIdFrom: null,
        brokerIdTo: parseInt(request.brokerId),
        brokerEmail: null,
      };

      const { error } = await supabase
        .from("Notifications")
        .insert(notificationData);

      if (error) {
        console.error("Error sending withdrawal notification:", error);
        // Don't throw error here as it shouldn't break the withdrawal process
      } else {
        console.log(
          "Withdrawal notification sent successfully to broker:",
          request.brokerId
        );
      }
    } catch (error) {
      console.error("Error in sendWithdrawalNotification:", error);
    }
  };

  const sendResetNotification = async (request, ordersCount) => {
    try {
      console.log(
        "Sending reset notification for broker ID:",
        request.brokerId,
        "Type:",
        typeof request.brokerId
      );

      const notificationData = {
        title: "🔄 Withdrawal Request Reset to Pending",
        msg:
          `📋 Your withdrawal request has been reset to pending status.\n\n` +
          `📊 **Details:**\n` +
          `• **Amount:** ${parseFloat(request.actualBalance).toLocaleString(
            "en-US",
            {
              style: "currency",
              currency: "EGP",
            }
          )}\n` +
          `• **Orders Restored:** ${ordersCount} orders reactivated\n` +
          `• **Status:** ⏳ Pending Review\n\n` +
          `💳 **Payment Method:**\n` +
          `${
            request.isVodafone
              ? `📱 Vodafone Cash: ${request.vodaCarrierName}`
              : ""
          }` +
          `${
            request.isInstaPay
              ? `💳 InstaPay: ${request.instaEmail || request.instaAccountName}`
              : ""
          }\n\n` +
          `📱 **Withdrawal Phone:** ${request.withDrawalPhone}\n\n` +
          `🔄 Your request is now back in the processing queue and will be reviewed again.\n\n` +
          `📞 If you have any questions, please contact our support team.`,
        isTemp: false,
        isAll: false,
        brokerIdFrom: null,
        brokerIdTo: parseInt(request.brokerId),
        brokerEmail: null,
      };

      const { error } = await supabase
        .from("Notifications")
        .insert(notificationData);

      if (error) {
        console.error("Error sending reset notification:", error);
        // Don't throw error here as it shouldn't break the reset process
      } else {
        console.log(
          "Reset notification sent successfully to broker:",
          request.brokerId
        );
      }
    } catch (error) {
      console.error("Error in sendResetNotification:", error);
    }
  };

  return (
    <div className="manage-withdrawal-container">
      <div className="manage-withdrawal-header">
        <h1 className="page-title">Manage Withdrawal Requests</h1>

        <div className="header-controls">
          <div className="tab-switcher">
            <button
              className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              Pending
              <span className="tab-badge">{pendingCount}</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "finished" ? "active" : ""}`}
              onClick={() => setActiveTab("finished")}
            >
              Finished
              <span className="tab-badge">{finishedCount}</span>
            </button>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {isLoading && !selectedRequest ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>No {activeTab} requests found</h3>
          <p>
            {searchQuery
              ? "Try adjusting your search criteria"
              : `There are no ${activeTab} withdrawal requests at the moment`}
          </p>
        </div>
      ) : (
        <div className="requests-grid">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="request-card"
              onClick={() => handleRequestClick(request)}
            >
              <div className="card-header">
                <div className="broker-info">
                  <h3 className="broker-name">{request.brokerName}</h3>
                  <span className="broker-email">{request.brokerEmail}</span>
                </div>
                <div className="balance-badge">
                  {parseFloat(request.actualBalance).toLocaleString("en-US", {
                    style: "currency",
                    currency: "EGP",
                  })}
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="value">{request.brokerPhone}</span>
                </div>

                <div className="info-row">
                  <span className="label">Withdrawal Phone:</span>
                  <span className="value">
                    {request.withDrawalPhone || "N/A"}
                  </span>
                </div>

                {request.isVodafone && (
                  <div className="payment-method vodafone">
                    <span className="method-icon">📱</span>
                    <div>
                      <div className="method-name">Vodafone Cash</div>
                      <div className="method-detail">
                        {request.vodaCarrierName}
                      </div>
                    </div>
                  </div>
                )}

                {request.isInstaPay && (
                  <div className="payment-method instapay">
                    <span className="method-icon">💳</span>
                    <div>
                      <div className="method-name">InstaPay</div>
                      <div className="method-detail">
                        {request.instaEmail || request.instaAccountName}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <span className="date">
                  {new Date(request.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {activeTab === "pending" && (
                  <button
                    className="action-btn finish-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFinishRequest(request);
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Finish"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedRequest && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>

            <div className="modal-header">
              <h2>Request Details</h2>
              {activeTab === "finished" && (
                <button
                  className="action-btn reset-btn"
                  onClick={() => handleResetToPending(selectedRequest)}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Reset to Pending"}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="modal-loading">
                <div className="spinner"></div>
                <p>Loading details...</p>
              </div>
            ) : (
              <>
                {/* Broker Information */}
                {brokerData && (
                  <div className="modal-section">
                    <h3 className="section-title">Broker Information</h3>
                    <div className="broker-details">
                      <div className="detail-item">
                        <span className="detail-label">Full Name:</span>
                        <span className="detail-value">
                          {brokerData.fullName}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Nickname:</span>
                        <span className="detail-value">
                          {brokerData.nickName}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Email:</span>
                        <span className="detail-value">{brokerData.email}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Phone:</span>
                        <span className="detail-value">{brokerData.phone}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Actual Balance:</span>
                        <span className="detail-value highlight">
                          {parseFloat(
                            brokerData.actualBalance || 0
                          ).toLocaleString("en-US", {
                            style: "currency",
                            currency: "EGP",
                          })}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Total Orders:</span>
                        <span className="detail-value">
                          {brokerData.totalOrders || 0}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Completed Orders:</span>
                        <span className="detail-value">
                          {brokerData.completedOrders || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders Section */}
                {activeTab === "pending" && brokerOrders.length > 0 && (
                  <div className="modal-section">
                    <h3 className="section-title">
                      Completed Orders ({brokerOrders.length})
                    </h3>
                    <div className="orders-summary">
                      <div className="summary-item">
                        <span className="summary-label">Total Revenue:</span>
                        <span className="summary-value">
                          {calculateTotalRevenue(brokerOrders).toLocaleString(
                            "en-US",
                            {
                              style: "currency",
                              currency: "EGP",
                            }
                          )}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Total Profit:</span>
                        <span className="summary-value highlight">
                          {calculateTotalProfit(brokerOrders).toLocaleString(
                            "en-US",
                            {
                              style: "currency",
                              currency: "EGP",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="orders-list">
                      {brokerOrders.map((order) => (
                        <div key={order.id} className="order-item">
                          <div className="order-header">
                            <span className="order-id">Order #{order.id}</span>
                            <span className="order-total">
                              {parseFloat(order.total).toLocaleString("en-US", {
                                style: "currency",
                                currency: "EGP",
                              })}
                            </span>
                          </div>
                          <div className="order-details">
                            <div className="order-customer">
                              <strong>{order.name}</strong> - {order.phone}
                            </div>
                            <div className="order-address">{order.address}</div>
                            {order.notes && (
                              <div className="order-notes">
                                Note: {order.notes}
                              </div>
                            )}
                            <div className="order-profit">
                              Profit:{" "}
                              {parseFloat(order.netProfit || 0).toLocaleString(
                                "en-US",
                                {
                                  style: "currency",
                                  currency: "EGP",
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "pending" && brokerOrders.length === 0 && (
                  <div className="empty-section">
                    <p>No completed orders found for this broker</p>
                  </div>
                )}

                {/* Deleted Orders Section */}
                {activeTab === "finished" && deletedOrders.length > 0 && (
                  <div className="modal-section">
                    <h3 className="section-title">
                      Archived Orders ({deletedOrders.length})
                    </h3>
                    <div className="orders-summary">
                      <div className="summary-item">
                        <span className="summary-label">Total Revenue:</span>
                        <span className="summary-value">
                          {calculateTotalRevenue(deletedOrders).toLocaleString(
                            "en-US",
                            {
                              style: "currency",
                              currency: "EGP",
                            }
                          )}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Total Profit:</span>
                        <span className="summary-value highlight">
                          {calculateTotalProfit(deletedOrders).toLocaleString(
                            "en-US",
                            {
                              style: "currency",
                              currency: "EGP",
                            }
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="orders-list">
                      {deletedOrders.map((order) => (
                        <div key={order.id} className="order-item archived">
                          <div className="order-header">
                            <span className="order-id">Order #{order.id}</span>
                            <span className="order-total">
                              {parseFloat(order.total).toLocaleString("en-US", {
                                style: "currency",
                                currency: "EGP",
                              })}
                            </span>
                          </div>
                          <div className="order-details">
                            <div className="order-customer">
                              <strong>{order.name}</strong> - {order.phone}
                            </div>
                            <div className="order-address">{order.address}</div>
                            {order.notes && (
                              <div className="order-notes">
                                Note: {order.notes}
                              </div>
                            )}
                            <div className="order-profit">
                              Profit:{" "}
                              {parseFloat(order.netProfit || 0).toLocaleString(
                                "en-US",
                                {
                                  style: "currency",
                                  currency: "EGP",
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "finished" && deletedOrders.length === 0 && (
                  <div className="empty-section">
                    <p>No archived orders found for this broker</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={handleModalConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        confirmText={confirmationModal.confirmText}
        cancelText={confirmationModal.cancelText}
        isLoading={isProcessing}
      />
    </div>
  );
};

export default ManageWithDrawal;
