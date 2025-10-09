import React, { useEffect, useState } from "react";
import supabase from "../../../SupabaseClient";
import "./ManageOrders.css";

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchOrders = async () => {
    const { data, error } = await supabase.from("Orders").select(`
        *,
        Brokers!inner(isVerified)
      `);
    if (error) {
      console.error("Error fetching orders:", error);
    } else if (data) {
      // Transform the data to include broker verification status
      const ordersWithBrokerStatus = data.map((order) => ({
        ...order,
        brokerVerified: order.Brokers?.isVerified || false,
      }));
      setOrders(ordersWithBrokerStatus);
      console.log("Fetched orders with broker status:", ordersWithBrokerStatus);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from("Orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      console.log("Order status updated successfully");
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.phone?.includes(searchTerm) ||
      order.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id?.toString().includes(searchTerm);

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "completed" && order.status) ||
      (filterStatus === "pending" && !order.status);

    return matchesSearch && matchesFilter;
  });

  const totalRevenue = orders.reduce(
    (sum, order) => sum + parseFloat(order.total || 0),
    0
  );
  const totalProfit = orders.reduce(
    (sum, order) => sum + parseFloat(order.netProfit || 0),
    0
  );
  return (
    <div className="manage-orders-container">
      <div className="header-section">
        <h1 className="page-title">
          <span className="title-icon">📦</span>
          Manage Orders
        </h1>
        <div className="order-stats">
          <div className="stat-badge">
            <span className="stat-label">Total Orders</span>
            <span className="stat-value">{orders.length}</span>
          </div>
          <div className="stat-badge completed">
            <span className="stat-label">Completed</span>
            <span className="stat-value">
              {orders.filter((o) => o.status).length}
            </span>
          </div>
          <div className="stat-badge pending">
            <span className="stat-label">Pending</span>
            <span className="stat-value">
              {orders.filter((o) => !o.status).length}
            </span>
          </div>
          <div className="stat-badge revenue">
            <span className="stat-label">Revenue</span>
            <span className="stat-value">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by order ID, name, phone, or address..."
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
              filterStatus === "completed" ? "filter-btn active" : "filter-btn"
            }
            onClick={() => setFilterStatus("completed")}
          >
            Completed
          </button>
          <button
            className={
              filterStatus === "pending" ? "filter-btn active" : "filter-btn"
            }
            onClick={() => setFilterStatus("pending")}
          >
            Pending
          </button>
        </div>
      </div>

      <div className="orders-grid">
        {filteredOrders.length === 0 ? (
          <div className="no-results-card">
            <span className="no-results-icon">📭</span>
            <p>No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id">
                  <span className="id-label">Order</span>
                  <span className="id-value">#{order.id}</span>
                </div>
                <div className="order-badges">
                  <button
                    className={
                      order.status
                        ? "status-badge completed"
                        : "status-badge pending"
                    }
                    onClick={() => updateOrderStatus(order.id, !order.status)}
                  >
                    <span className="status-icon">
                      {order.status ? "✓" : "⏳"}
                    </span>
                    {order.status ? "Completed" : "Pending"}
                  </button>

                  {order.brokerVerified && (
                    <div className="verification-badge verified">
                      <span className="verification-icon">✓</span>
                      <span className="verification-text">Verified Broker</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="order-customer">
                <div className="customer-avatar">
                  {order.name?.charAt(0).toUpperCase()}
                </div>
                <div className="customer-info">
                  <h3 className="customer-name">{order.name}</h3>
                  <span className="customer-phone">📱 {order.phone}</span>
                </div>
              </div>

              <div className="order-details">
                <div className="detail-item">
                  <span className="detail-icon">📍</span>
                  <div className="detail-content">
                    <span className="detail-label">Delivery Address</span>
                    <span className="detail-value">{order.address}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-icon">🛒</span>
                  <div className="detail-content">
                    <span className="detail-label">Items</span>
                    <span className="detail-value">
                      {order.cart?.length || 0} item(s)
                    </span>
                  </div>
                </div>

                {order.notes && (
                  <div className="detail-item">
                    <span className="detail-icon">📝</span>
                    <div className="detail-content">
                      <span className="detail-label">Notes</span>
                      <span className="detail-value">{order.notes}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="order-financial">
                <div className="financial-item">
                  <span className="financial-label">Total</span>
                  <span className="financial-value total">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Net Profit</span>
                  <span className="financial-value profit">
                    {formatCurrency(order.netProfit)}
                  </span>
                </div>
              </div>

              <div className="order-footer">
                <span className="order-date">
                  🕒 {formatDate(order.created_at)}
                </span>
                <button
                  className="view-details-btn"
                  onClick={() => setSelectedOrder(order)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="order-modal" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="manage-orders-close-btn-x"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(null);
              }}
            >
              ×
            </button>

            <h2 className="modal-title">
              <span className="modal-icon">📦</span>
              Order #{selectedOrder.id} Details
            </h2>

            <div className="modal-section">
              <h3 className="section-title">Customer Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Name</span>
                  <span className="info-value">{selectedOrder.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{selectedOrder.phone}</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">Address</span>
                  <span className="info-value">{selectedOrder.address}</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3 className="section-title">Cart Items</h3>
              <div className="cart-items">
                {selectedOrder.cart?.map((item, index) => (
                  <div key={index} className="cart-item">
                    <div className="item-info">
                      <span className="item-name">
                        {item.name || `Item ${index + 1}`}
                      </span>
                      <span className="item-quantity">
                        Qty: {item.quantity || 1}
                      </span>
                    </div>
                    <span className="item-price">
                      {formatCurrency(item.price || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-section">
              <h3 className="section-title">Order Summary</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Total Amount</span>
                  <span className="summary-value">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Net Profit</span>
                  <span className="summary-value profit">
                    {formatCurrency(selectedOrder.netProfit)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Broker ID</span>
                  <span className="summary-value">
                    #{selectedOrder.brokerId}
                    {selectedOrder.brokerVerified && (
                      <span className="modal-verification-badge">
                        <span className="modal-verification-icon">✓</span>
                        Verified
                      </span>
                    )}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Order Date</span>
                  <span className="summary-value">
                    {formatDate(selectedOrder.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {selectedOrder.notes && (
              <div className="modal-section">
                <h3 className="section-title">Notes</h3>
                <p className="notes-content">{selectedOrder.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOrders;
