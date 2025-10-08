/* eslint-disable react/prop-types */
import React from "react";
import "./DeletePopup.css";

const DeletePopup = ({
  showModal,
  selectedBroker,
  tempMessages,
  onClose,
  onDeleteBroker,
  onNavigateToNotifications,
}) => {
  if (!showModal || !selectedBroker) return null;

  return (
    <div className="modal-overlay">
      <div className="delete-modal">
        <div className="modal-header">
          <h3>Delete Broker: {selectedBroker.fullName}</h3>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <div className="modal-msg-content">
          <p>Select a message to send to the broker before deletion:</p>

          {/* Send Customizable Message Button */}
          <div className="custom-message-section">
            <button
              onClick={() => onNavigateToNotifications(selectedBroker.email)}
              className="custom-message-btn"
            >
              <span className="btn-icon">✏️ Send Customizable Message</span>
            </button>
          </div>

          {tempMessages.length === 0 ? (
            <div className="no-temp-messages">
              <p>
                No temporary messages found. Please create some in the
                Notifications section first.
              </p>
            </div>
          ) : (
            <div className="temp-messages-list">
              {tempMessages.map((tempMsg) => (
                <button
                  key={tempMsg.id}
                  onClick={() => onDeleteBroker(selectedBroker.id, tempMsg)}
                  className="temp-message-btn"
                >
                  <div className="temp-msg-title">{tempMsg.title}</div>
                  <div className="temp-msg-preview">
                    <div
                      className="temp-msg-html-preview"
                      dangerouslySetInnerHTML={{ __html: tempMsg.msg }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeletePopup;
