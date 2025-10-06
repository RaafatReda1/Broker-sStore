/* eslint-disable react/prop-types */
import React from "react";
import "./ViewStatistics.css";

const ViewStatistics = ({ broker, show, onClose }) => {
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
        <button className="close-btn-x" onClick={handleClose}>X</button>
        
        <h2 className="statistics-title">
          <span className="stats-icon">📊</span>
          Statistics for {broker.fullName}
        </h2>

        <div className="statistics-grid">
          <div className="stat-card balance-card">
            <div className="stat-icon">💰</div>
            <h4 className="stat-card-title">Available Balance</h4>
            <div className="stat-card-value available-balance">
              {formatCurrency(broker.actualBalance)}
            </div>
          </div>

          <div className="stat-card balance-card">
            <div className="stat-icon">🔒</div>
            <h4 className="stat-card-title">Held Balance</h4>
            <div className="stat-card-value held-balance">
              {formatCurrency(broker.suspendedBalance)}
            </div>
          </div>

          <div className="stat-card orders-card">
            <div className="stat-icon">📦</div>
            <h4 className="stat-card-title">Total Orders</h4>
            <div className="stat-card-value total-orders">
              {broker.totalOrders || 0}
            </div>
          </div>

          <div className="stat-card orders-card">
            <div className="stat-icon">✅</div>
            <h4 className="stat-card-title">Completed Orders</h4>
            <div className="stat-card-value completed-orders">
              {broker.completedOrders || 0}
            </div>
          </div>

          <div className="stat-card orders-card">
            <div className="stat-icon">⏳</div>
            <h4 className="stat-card-title">Pending Orders</h4>
            <div className="stat-card-value pending-orders">
              {broker.pendingOrders || 0}
            </div>
          </div>

          <div className="stat-card revenue-card">
            <div className="stat-icon">💵</div>
            <h4 className="stat-card-title">Total Revenue</h4>
            <div className="stat-card-value total-revenue">
              {formatCurrency(broker.totalRevenue)}
            </div>
          </div>

          <div className="stat-card revenue-card">
            <div className="stat-icon">📈</div>
            <h4 className="stat-card-title">Avg Order Value</h4>
            <div className="stat-card-value avg-order-value">
              {formatCurrency(broker.averageOrderValue)}
            </div>
          </div>

          <div className="stat-card conversion-card">
            <div className="stat-icon">🎯</div>
            <h4 className="stat-card-title">Conversion Rate</h4>
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