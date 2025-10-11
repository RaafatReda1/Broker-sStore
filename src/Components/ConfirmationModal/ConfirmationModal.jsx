/* eslint-disable react/prop-types */
import React from "react";
import "./ConfirmationModal.css";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // warning, success, danger, info
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅";
      case "danger":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "🤔";
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case "success":
        return "confirm-btn success";
      case "danger":
        return "confirm-btn danger";
      case "info":
        return "confirm-btn info";
      default:
        return "confirm-btn warning";
    }
  };

  return (
    <div className="confirmation-modal-overlay" onClick={handleBackdropClick}>
      <div className="confirmation-modal" style={{ overflow: "auto" }}>
        <div className="modal-header">
          <div className="modal-icon">{getIcon()}</div>
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>
            X
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-message">{message}</div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </button>
          <button
            className={getButtonClass()}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
