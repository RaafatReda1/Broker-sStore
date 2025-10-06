/* eslint-disable react/prop-types */
import React from 'react'

const ViewStatistics = ({broker, show, onClose}) => {
  const {showStatistics, setShowStatistics} = show
  return (
    <>
      <p>ViewStatistics for {broker.fullName}</p>
       <button
        onClick={() => {
          setShowStatistics(false); // 🔹 يغلق الـ modal
          onClose(); // 🔹 لو عايز تنفذ أي منطق إضافي
        }}
        style={{
          marginTop: "10px",
          padding: "5px 10px",
          backgroundColor: "crimson",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Close
      </button>
    </>
  )
}

export default ViewStatistics