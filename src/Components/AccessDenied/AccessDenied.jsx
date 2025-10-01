import React from "react";
import { Link } from "react-router-dom";
import "./AccessDenied.css";

// eslint-disable-next-line react/prop-types
const AccessDenied = ({ message, redirectTo = "/", redirectText = "Go to Home" }) => {
  return (
    <div className="access-denied">
      <div className="access-denied-card">
        <div className="access-denied-icon">🚫</div>
        <h2>Access Denied</h2>
        <p className="access-denied-message">{message}</p>
        <Link to={redirectTo}>
          <button className="access-denied-btn">{redirectText}</button>
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied;
