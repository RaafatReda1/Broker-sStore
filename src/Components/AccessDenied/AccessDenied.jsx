import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import "./AccessDenied.css";

// eslint-disable-next-line react/prop-types
const AccessDenied = ({ message, redirectTo = "/", redirectText }) => {
  const { t } = useTranslation();
  const defaultRedirectText = redirectText || t("accessDenied.goToHome");

  return (
    <div className="access-denied">
      <div className="access-denied-card">
        <div className="access-denied-icon">🚫</div>
        <h2>{t("accessDenied.title")}</h2>
        <p className="access-denied-message">{message}</p>
        <Link to={redirectTo}>
          <button className="access-denied-btn">{defaultRedirectText}</button>
        </Link>
      </div>
    </div>
  );
};

export default AccessDenied;
