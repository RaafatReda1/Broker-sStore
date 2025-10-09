import React, { useState, useEffect } from "react";
import "./ManageWithDrawal.css";
import supabase from "../../../SupabaseClient";
import { toast } from "react-toastify";

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

  // Fetch withdrawal requests
  useEffect(() => {
    fetchWithdrawalRequests();
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
      toast.error("Failed to fetch withdrawal requests");
    } finally {
      setIsLoading(false);
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
      toast.error("Failed to fetch broker details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishRequest = async (request) => {
    if (!window.confirm("Are you sure you want to finish this withdrawal request? This will move all completed orders to deleted orders.")) {
      return;
    }

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
        const ordersToDelete = completedOrders.map(order => ({
          name: order.name,
          phone: order.phone,
          address: order.address,
          cart: order.cart,
          total: order.total,
          notes: order.notes,
          brokerId: order.brokerId,
          status: order.status,
          netProfit: order.netProfit,
          created_at: order.created_at
        }));

        const { error: insertError } = await supabase
          .from("DeletedOrders")
          .insert(ordersToDelete);

        if (insertError) throw insertError;

        // 3. Delete orders from Orders table
        const orderIds = completedOrders.map(order => order.id);
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

      toast.success(`Withdrawal request finished! ${completedOrders?.length || 0} orders moved to deleted orders.`);
      fetchWithdrawalRequests();
      setSelectedRequest(null);
      setBrokerData(null);
      setBrokerOrders([]);
    } catch (error) {
      console.error("Error finishing request:", error);
      toast.error("Failed to finish withdrawal request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetToPending = async (request) => {
    if (!window.confirm("Are you sure you want to reset this request to pending?")) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("WithDrawalRequests")
        .update({ Status: false })
        .eq("id", request.id);

      if (error) throw error;

      toast.success("Request reset to pending successfully!");
      fetchWithdrawalRequests();
      setSelectedRequest(null);
      setBrokerData(null);
      setDeletedOrders([]);
    } catch (error) {
      console.error("Error resetting request:", error);
      toast.error("Failed to reset request");
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
    return orders.reduce((sum, order) => sum + parseFloat(order.netProfit || 0), 0);
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
              <span className="tab-badge">
                {withdrawalRequests.length}
              </span>
            </button>
            <button
              className={`tab-btn ${activeTab === "finished" ? "active" : ""}`}
              onClick={() => setActiveTab("finished")}
            >
              Finished
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
            <span className="search-icon">🔍</span>
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
                  <span className="value">{request.withDrawalPhone || "N/A"}</span>
                </div>

                {request.isVodafone && (
                  <div className="payment-method vodafone">
                    <span className="method-icon">📱</span>
                    <div>
                      <div className="method-name">Vodafone Cash</div>
                      <div className="method-detail">{request.vodaCarrierName}</div>
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
                        <span className="detail-value">{brokerData.fullName}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Nickname:</span>
                        <span className="detail-value">{brokerData.nickName}</span>
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
                          {parseFloat(brokerData.actualBalance || 0).toLocaleString("en-US", {
                            style: "currency",
                            currency: "EGP",
                          })}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Total Orders:</span>
                        <span className="detail-value">{brokerData.totalOrders || 0}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Completed Orders:</span>
                        <span className="detail-value">{brokerData.completedOrders || 0}</span>
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
                          {calculateTotalRevenue(brokerOrders).toLocaleString("en-US", {
                            style: "currency",
                            currency: "EGP",
                          })}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Total Profit:</span>
                        <span className="summary-value highlight">
                          {calculateTotalProfit(brokerOrders).toLocaleString("en-US", {
                            style: "currency",
                            currency: "EGP",
                          })}
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
                              <div className="order-notes">Note: {order.notes}</div>
                            )}
                            <div className="order-profit">
                              Profit: {parseFloat(order.netProfit || 0).toLocaleString("en-US", {
                                style: "currency",
                                currency: "EGP",
                              })}
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
                          {calculateTotalRevenue(deletedOrders).toLocaleString("en-US", {
                            style: "currency",
                            currency: "EGP",
                          })}
                        </span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Total Profit:</span>
                        <span className="summary-value highlight">
                          {calculateTotalProfit(deletedOrders).toLocaleString("en-US", {
                            style: "currency",
                            currency: "EGP",
                          })}
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
                              <div className="order-notes">Note: {order.notes}</div>
                            )}
                            <div className="order-profit">
                              Profit: {parseFloat(order.netProfit || 0).toLocaleString("en-US", {
                                style: "currency",
                                currency: "EGP",
                              })}
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
    </div>
  );
};

export default ManageWithDrawal;