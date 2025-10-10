import React, { useState } from "react";
import { X, Trash2, AlertTriangle, MessageSquare } from "lucide-react";
import "./DeleteOrderModal.css";

const DeleteOrderModal = ({ isOpen, onClose, order, onConfirmDelete }) => {
  const [staffComment, setStaffComment] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!order) return;

    setIsDeleting(true);
    try {
      await onConfirmDelete(order.id, staffComment.trim());
      setStaffComment("");
      onClose();
    } catch (error) {
      console.error("Error deleting order:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setStaffComment("");
      onClose();
    }
  };

  if (!isOpen || !order) return null;

  return (
    <div className="delete-modal-overlay" onClick={handleClose}>
      <div
        className="delete-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-modal-header">
          <div className="delete-modal-title">
            <AlertTriangle className="warning-icon" size={24} />
            <h3>Delete Order</h3>
          </div>
          <button
            className="close-btn"
            onClick={handleClose}
            disabled={isDeleting}
          >
            <X size={20} />
          </button>
        </div>

        <div className="delete-modal-body">
          <div className="order-info">
            <div className="order-detail">
              <span className="detail-label">Order ID:</span>
              <span className="detail-value">#{order.id}</span>
            </div>
            <div className="order-detail">
              <span className="detail-label">Customer:</span>
              <span className="detail-value">{order.name}</span>
            </div>
            <div className="order-detail">
              <span className="detail-label">Total:</span>
              <span className="detail-value">
                ${parseFloat(order.total || 0).toFixed(2)}
              </span>
            </div>
            <div className="order-detail">
              <span className="detail-label">Broker Profit:</span>
              <span className="detail-value">
                ${parseFloat(order.netProfit || 0).toFixed(2)}
              </span>
            </div>
            <div className="order-detail">
              <span className="detail-label">Broker ID:</span>
              <span className="detail-value">{order.brokerId}</span>
            </div>
          </div>

          <div className="warning-message">
            <AlertTriangle className="warning-icon-small" size={16} />
            <p>
              <strong>Warning:</strong> This action cannot be undone. The order
              will be permanently deleted and the broker will be notified.
            </p>
          </div>

          <div className="comment-section">
            <label className="comment-label">
              <MessageSquare size={16} />
              Staff Comment (Optional)
            </label>
            <textarea
              className="comment-textarea"
              value={staffComment}
              onChange={(e) => setStaffComment(e.target.value)}
              placeholder="Add a comment explaining why this order is being deleted..."
              disabled={isDeleting}
              rows={3}
            />
            <small className="comment-help">
              This comment will be included in the notification sent to the
              broker.
            </small>
          </div>
        </div>

        <div className="delete-modal-footer">
          <button
            className="cancel-btn"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className="delete-btn"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="spinner"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Order
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteOrderModal;
