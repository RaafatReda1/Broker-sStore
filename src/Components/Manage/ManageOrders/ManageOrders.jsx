import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import supabase from "../../../SupabaseClient";
import "./ManageOrders.css";
import NotificationService from "../../../utils/notificationService";
import DeleteOrderModal from "./DeleteOrderModal";
import { toast } from "react-toastify";

const ManageOrders = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);

  const fetchOrders = async () => {
    const { data, error } = await supabase.from("Orders").select(`
        *,
        Brokers(isVerified)
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
      // Find the order to get broker information
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        console.error("Order not found:", orderId);
        return;
      }

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

      // Send notification to broker about status change
      try {
        await NotificationService.notifyOrderStatusChange(order, newStatus);
        console.log("Order status change notification sent to broker");
      } catch (notificationError) {
        console.error(
          "Failed to send status change notification:",
          notificationError
        );
        // Don't show error to user as order status was updated successfully
      }
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  // Bulk status update function
  const updateBulkOrderStatus = async (orderIds, newStatus) => {
    try {
      const { error } = await supabase
        .from("Orders")
        .update({ status: newStatus })
        .in("id", orderIds);

      if (error) throw error;

      // Update local state
      setOrders((prev) =>
        prev.map((order) =>
          orderIds.includes(order.id) ? { ...order, status: newStatus } : order
        )
      );

      console.log("Bulk order status updated successfully");

      // Get orders for notification
      const updatedOrders = orders.filter((order) =>
        orderIds.includes(order.id)
      );

      // Send bulk notification
      try {
        await NotificationService.notifyBulkOrderStatusChange(
          updatedOrders,
          newStatus
        );
        console.log("Bulk order status change notification sent to brokers");
      } catch (notificationError) {
        console.error(
          "Failed to send bulk status change notification:",
          notificationError
        );
      }
    } catch (error) {
      console.error("Error updating bulk order status:", error);
    }
  };

  // Handle order deletion
  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
    setShowDeleteModal(true);
  };

  const confirmDeleteOrder = async (orderId, staffComment) => {
    try {
      // Find the order to get broker information
      const order = orders.find((o) => o.id === orderId);
      if (!order) {
        console.error("Order not found:", orderId);
        toast.error(t("manageOrders.orderNotFound"));
        return;
      }

      // Delete the order from database
      const { error } = await supabase
        .from("Orders")
        .delete()
        .eq("id", orderId);

      if (error) throw error;

      // Remove from local state
      setOrders((prev) => prev.filter((o) => o.id !== orderId));

      // Close any open order details if this order was selected
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }

      console.log("Order deleted successfully");

      // Send notification to broker about deletion
      try {
        await NotificationService.notifyOrderDeletion(order, staffComment);
        console.log("Order deletion notification sent to broker");
        toast.success("Order deleted successfully and broker notified!");
      } catch (notificationError) {
        console.error(
          "Failed to send deletion notification:",
          notificationError
        );
        toast.success(
          "Order deleted successfully, but failed to notify broker."
        );
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order. Please try again.");
      throw error; // Re-throw to let the modal handle the error state
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
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
          {t("manageOrders.title")}
        </h1>
        <div className="order-stats">
          <div className="stat-badge">
            <span className="stat-label">{t("manageOrders.totalOrders")}</span>
            <span className="stat-value">{orders.length}</span>
          </div>
          <div className="stat-badge completed">
            <span className="stat-label">{t("manageOrders.completed")}</span>
            <span className="stat-value">
              {orders.filter((o) => o.status).length}
            </span>
          </div>
          <div className="stat-badge pending">
            <span className="stat-label">{t("manageOrders.pending")}</span>
            <span className="stat-value">
              {orders.filter((o) => !o.status).length}
            </span>
          </div>
          <div className="stat-badge revenue">
            <span className="stat-label">{t("manageOrders.revenue")}</span>
            <span className="stat-value">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-box">
          <input
            type="text"
            placeholder={t("manageOrders.searchPlaceholder")}
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
            {t("manageOrders.all")}
          </button>
          <button
            className={
              filterStatus === "completed" ? "filter-btn active" : "filter-btn"
            }
            onClick={() => setFilterStatus("completed")}
          >
            {t("manageOrders.completed")}
          </button>
          <button
            className={
              filterStatus === "pending" ? "filter-btn active" : "filter-btn"
            }
            onClick={() => setFilterStatus("pending")}
          >
            {t("manageOrders.pending")}
          </button>
        </div>
      </div>

      <div className="orders-grid">
        {filteredOrders.length === 0 ? (
          <div className="no-results-card">
            <span className="no-results-icon">📭</span>
            <p>{t("manageOrders.noOrdersFound")}</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id">
                  <span className="id-label">{t("manageOrders.order")}</span>
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
                    {order.status
                      ? t("manageOrders.completed")
                      : t("manageOrders.pending")}
                  </button>

                  {order.brokerVerified && (
                    <div className="verification-badge verified">
                      <span className="verification-icon">✓</span>
                      <span className="verification-text">
                        {t("manageOrders.verifiedBroker")}
                      </span>
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
                    <span className="detail-label">
                      {t("manageOrders.deliveryAddress")}
                    </span>
                    <span className="detail-value">{order.address}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <span className="detail-icon">🛒</span>
                  <div className="detail-content">
                    <span className="detail-label">
                      {t("manageOrders.items")}
                    </span>
                    <span className="detail-value">
                      {order.cart?.length || 0} item(s)
                    </span>
                  </div>
                </div>

                {order.notes && (
                  <div className="detail-item">
                    <span className="detail-icon">📝</span>
                    <div className="detail-content">
                      <span className="detail-label">
                        {t("manageOrders.notes")}
                      </span>
                      <span className="detail-value">{order.notes}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="order-financial">
                <div className="financial-item">
                  <span className="financial-label">
                    {t("manageOrders.total")}
                  </span>
                  <span className="financial-value total">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">
                    {t("manageOrders.netProfit")}
                  </span>
                  <span className="financial-value profit">
                    {formatCurrency(order.netProfit)}
                  </span>
                </div>
              </div>

              <div className="order-footer">
                <span className="order-date">
                  🕒 {formatDate(order.created_at)}
                </span>
                <div className="order-actions">
                  <button
                    className="view-details-btn"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {t("manageOrders.viewDetails")}
                  </button>
                  <button
                    className="delete-order-btn"
                    onClick={() => handleDeleteOrder(order)}
                    title={t("manageOrders.deleteOrder")}
                  >
                    🗑️
                  </button>
                </div>
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
              {t("manageOrders.orderId")} #{selectedOrder.id}{" "}
              {t("manageOrders.details")}
            </h2>

            <div className="modal-section">
              <h3 className="section-title">
                {t("manageOrders.customerInformation")}
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">{t("checkout.fullName")}</span>
                  <span className="info-value">{selectedOrder.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    {t("checkout.phoneNumber")}
                  </span>
                  <span className="info-value">{selectedOrder.phone}</span>
                </div>
                <div className="info-item full-width">
                  <span className="info-label">
                    {t("checkout.deliveryAddress")}
                  </span>
                  <span className="info-value">{selectedOrder.address}</span>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3 className="section-title">{t("manageOrders.cartItems")}</h3>
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
              <h3 className="section-title">
                {t("manageOrders.orderSummary")}
              </h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">
                    {t("manageOrders.totalAmount")}
                  </span>
                  <span className="summary-value">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">
                    {t("manageOrders.netProfit")}
                  </span>
                  <span className="summary-value profit">
                    {formatCurrency(selectedOrder.netProfit)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">
                    {t("manageOrders.brokerId")}
                  </span>
                  <span className="summary-value">
                    #{selectedOrder.brokerId}
                    {selectedOrder.brokerVerified && (
                      <span className="modal-verification-badge">
                        <span className="modal-verification-icon">✓</span>
                        {t("manageBrokers.verified")}
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

      {/* Delete Order Modal */}
      <DeleteOrderModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        order={orderToDelete}
        onConfirmDelete={confirmDeleteOrder}
      />
    </div>
  );
};

export default ManageOrders;
