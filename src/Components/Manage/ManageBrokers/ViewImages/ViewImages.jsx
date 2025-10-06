/* eslint-disable react/prop-types */
import React, { useState } from "react";
import "./ViewImages.css";

const ViewImages = ({ broker, show, onClose }) => {
  const { showImages, setShowImages } = show;
  const [selectedImg, setSelectedImg] = useState(null);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  if (!showImages) return null;

  const images = [
    { src: broker.idCardFront, alt: "Front ID" },
    { src: broker.idCardBack, alt: "Back ID" },
    { src: broker.selfieWithIdCard, alt: "Selfie with ID" }
  ];

  const handleClose = () => {
    setShowImages(false);
    setSelectedImg(null);
    onClose();
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <>
      <div className="popup-overlay" onClick={handleClose}>
        <div className="popup-container" onClick={(e) => e.stopPropagation()}>
          <button className="close-btn-x" onClick={handleClose}>X</button>
          <h2>ID Card Images - {broker.fullName}</h2>
          <div className="images-grid">
            {images.map((img, idx) => (
              <div key={idx} className="img-wrapper" onMouseMove={handleMouseMove}>
                <img 
                  src={img.src} 
                  alt={img.alt}
                  style={{'--mouse-x': `${zoomPos.x}%`, '--mouse-y': `${zoomPos.y}%`}}
                  onClick={() => setSelectedImg(idx)}
                />
                <span className="img-label">{img.alt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedImg !== null && (
        <div className="lightbox-overlay" onClick={() => setSelectedImg(null)}>
          <button className="lightbox-close" onClick={() => setSelectedImg(null)}>X</button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-main-wrapper" onMouseMove={handleMouseMove}>
              <img 
                src={images[selectedImg].src} 
                alt={images[selectedImg].alt} 
                className="lightbox-main"
                style={{'--mouse-x': `${zoomPos.x}%`, '--mouse-y': `${zoomPos.y}%`}}
              />
            </div>
            <div className="lightbox-thumbnails">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img.src}
                  alt={img.alt}
                  className={selectedImg === idx ? "thumb active" : "thumb"}
                  onClick={() => setSelectedImg(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewImages;