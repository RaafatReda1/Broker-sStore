import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, Trash2, AlertTriangle, MessageSquare } from "lucide-react";
import "./DeleteOrderModal.css";

const DeleteOrderModal = ({ isOpen, onClose, order, onConfirmDelete }) => {
  const { t } = useTranslation();
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
      // Error handled silently
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
            <h3>{t("manageOrders.deleteOrder")}</h3>
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
              <span className="detail-label">{t("manageOrders.orderId")}:</span>
              <span className="detail-value">#{order.id}</span>
            </div>
            <div className="order-detail">
              <span className="detail-label">
                {t("manageOrders.customerName")}:
              </span>
              <span className="detail-value">{order.name}</span>
            </div>
            <div className="order-detail">
              <span className="detail-label">
                {t("manageOrders.orderTotal")}:
              </span>
              <span className="detail-value">
                ${parseFloat(order.total || 0).toFixed(2)}
              </span>
            </div>
            <div className="order-detail">
              <span className="detail-label">
                {t("manageOrders.brokerProfit")}:
              </span>
              <span className="detail-value">
                ${parseFloat(order.netProfit || 0).toFixed(2)}
              </span>
            </div>
            <div className="order-detail">
              <span className="detail-label">
                {t("manageOrders.brokerId")}:
              </span>
              <span className="detail-value">{order.brokerId}</span>
            </div>
          </div>

          <div className="warning-message">
            <AlertTriangle className="warning-icon-small" size={16} />
            <p>
              <strong>{t("common.warning")}:</strong>{" "}
              {t("manageOrders.deleteWarning")}
            </p>
          </div>

          <div className="comment-section">
            <label className="comment-label">
              <MessageSquare size={16} />
              {t("manageOrders.staffComment")}
            </label>
            <textarea
              className="comment-textarea"
              value={staffComment}
              onChange={(e) => setStaffComment(e.target.value)}
              placeholder={t("manageOrders.deleteCommentPlaceholder")}
              disabled={isDeleting}
              rows={3}
            />
            <small className="comment-help">
              {t("manageOrders.deleteCommentHelp")}
            </small>
          </div>
        </div>

        <div className="delete-modal-footer">
          <button
            className="cancel-btn"
            onClick={handleClose}
            disabled={isDeleting}
          >
            {t("common.cancel")}
          </button>
          <button
            className="delete-btn"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <div className="spinner"></div>
                {t("common.deleting")}
              </>
            ) : (
              <>
                <Trash2 size={16} />
                {t("manageOrders.deleteOrder")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteOrderModal;
