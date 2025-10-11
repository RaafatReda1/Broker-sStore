import React from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Shield, User, ShoppingBag } from "lucide-react";
import "./AppLoading.css";

const AppLoading = () => {
  const { t } = useTranslation();

  return (
    <div className="app-loading-container">
      <div className="app-loading-content">
        {/* Logo/Icon */}
        <div className="loading-logo">
          <Shield size={64} className="logo-icon" />
          <h1 className="loading-title">Cicada</h1>
        </div>

        {/* Loading Spinner */}
        <div className="loading-spinner-container">
          <Loader2 size={48} className="loading-spinner" />
        </div>

        {/* Loading Text */}
        <div className="loading-text-container">
          <h2 className="loading-message">{t("appLoading.initializing")}</h2>
          <p className="loading-subtitle">
            {t("appLoading.checkingPermissions")}
          </p>
        </div>

        {/* Role Icons */}
        <div className="role-icons-container">
          <div className="role-icon-item">
            <User size={24} className="role-icon" />
            <span className="role-label">{t("appLoading.broker")}</span>
          </div>
          <div className="role-icon-item">
            <Shield size={24} className="role-icon" />
            <span className="role-label">{t("appLoading.staff")}</span>
          </div>
          <div className="role-icon-item">
            <ShoppingBag size={24} className="role-icon" />
            <span className="role-label">{t("appLoading.customer")}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLoading;
