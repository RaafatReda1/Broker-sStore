/* eslint-disable react/prop-types */
import React from "react";
import "./ViewImages.css"; // هنضيف الستايلات هنا

const ViewImages = ({ broker, show, onClose }) => {
  const { showImages, setShowImages } = show;

  if (!showImages) return null; // ما يظهرش إلا وقت ما يكون مفعل

  return (
    <div className="popup-overlay">
      <div className="popup-container">
        <h2>Images for {broker.fullName}</h2>

        <div className="images-grid">
          <img src={broker.idCardFront} alt="Front ID" />
          <img src={broker.idCardBack} alt="Back ID" />
          <img src={broker.selfieWithIdCard} alt="Selfie with ID" />
        </div>

        <button
          className="close-btn"
          onClick={() => {
            setShowImages(false);
            onClose();
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ViewImages;
