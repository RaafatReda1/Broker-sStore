/* eslint-disable react/prop-types */
import React from "react";
import { useTranslation } from "react-i18next";
import "./ViewStatistics.css";

const ViewStatistics = ({ broker, show, onClose }) => {
  const { t } = useTranslation();
  const { showStatistics, setShowStatistics } = show;

  if (!showStatistics) return null;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);

  const handleClose = () => {
    setShowStatistics(false);
    onClose();
  };

  return (
    <div className="statistics-modal" onClick={handleClose}>
      <div className="statistics-content" onClick={(e) => e.stopPropagation()}>
        <button className="view-statistics-close-btn-x" onClick={handleClose}>
          X
        </button>

        <h2 className="statistics-title">
          <span className="stats-icon">📊</span>
          {t("viewStatistics.title")} {broker.fullName}
        </h2>

        <div className="statistics-grid">
          <div className="stat-card balance-card">
            <div className="stat-icon">💰</div>
            <h4 className="stat-card-title">
              {t("viewStatistics.availableBalance")}
            </h4>
            <div className="stat-card-value available-balance">
              {formatCurrency(broker.actualBalance)}
            </div>
          </div>

          <div className="stat-card balance-card">
            <div className="stat-icon">🔒</div>
            <h4 className="stat-card-title">
              {t("viewStatistics.heldBalance")}
            </h4>
            <div className="stat-card-value held-balance">
              {formatCurrency(broker.suspendedBalance)}
            </div>
          </div>

          <div className="stat-card orders-card">
            <div className="stat-icon">📦</div>
            <h4 className="stat-card-title">
              {t("viewStatistics.totalOrders")}
            </h4>
            <div className="stat-card-value total-orders">
              {broker.totalOrders || 0}
            </div>
          </div>

          <div className="stat-card orders-card">
            <div className="stat-icon">✅</div>
            <h4 className="stat-card-title">
              {t("viewStatistics.completedOrders")}
            </h4>
            <div className="stat-card-value completed-orders">
              {broker.completedOrders || 0}
            </div>
          </div>

          <div className="stat-card orders-card">
            <div className="stat-icon">⏳</div>
            <h4 className="stat-card-title">
              {t("viewStatistics.pendingOrders")}
            </h4>
            <div className="stat-card-value pending-orders">
              {broker.pendingOrders || 0}
            </div>
          </div>

          <div className="stat-card revenue-card">
            <div className="stat-icon">💵</div>
            <h4 className="stat-card-title">
              {t("viewStatistics.totalRevenue")}
            </h4>
            <div className="stat-card-value total-revenue">
              {formatCurrency(broker.totalRevenue)}
            </div>
          </div>

          <div className="stat-card revenue-card">
            <div className="stat-icon">📈</div>
            <h4 className="stat-card-title">
              {t("viewStatistics.avgOrderValue")}
            </h4>
            <div className="stat-card-value avg-order-value">
              {formatCurrency(broker.averageOrderValue)}
            </div>
          </div>

          <div className="stat-card conversion-card">
            <div className="stat-icon">🎯</div>
            <h4 className="stat-card-title">
              {t("viewStatistics.conversionRate")}
            </h4>
            <div className="stat-card-value conversion-rate">
              {((broker.conversionRate || 0) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStatistics;
