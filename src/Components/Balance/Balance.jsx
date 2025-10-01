import { useContext, useMemo } from "react";
import React from "react";

import "./Balance.css";
import { userDataContext } from "../../AppContexts";
import BrokersArrangement from "./BrokersArrangement/BrokersArrangement";

const Balance = () => {
  const { userData } = useContext(userDataContext);

  const formatters = useMemo(() => {
    const currency = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
    const number = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    });
    const percent = new Intl.NumberFormat(undefined, {
      style: "percent",
      maximumFractionDigits: 2,
    });
    const date = new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    return { currency, number, percent, date };
  }, []);

  const stats = useMemo(() => {
    if (!userData) return null;

    const suspendedBalance = Number(userData.suspendedBalance ?? 0);
    const actualBalance = Number(userData.actualBalance ?? 0);
    const totalOrders = Number(userData.totalOrders ?? 0);
    const completedOrders = Number(userData.completedOrders ?? 0);
    const pendingOrders = Number(userData.pendingOrders ?? 0);
    const totalRevenue = Number(userData.totalRevenue ?? 0);
    const averageOrderValue = Number(userData.averageOrderValue ?? 0);
    const conversionRate = Number(userData.conversionRate ?? 0);
    const lastOrderDate = userData.lastOrderDate
      ? new Date(userData.lastOrderDate)
      : null;

    return {
      suspendedBalance,
      actualBalance,
      totalOrders,
      completedOrders,
      pendingOrders,
      totalRevenue,
      averageOrderValue,
      conversionRate,
      lastOrderDate,
    };
  }, [userData]);

  const derived = useMemo(() => {
    if (!stats) return null;
    const completionRate =
      stats.totalOrders > 0 ? stats.completedOrders / stats.totalOrders : 0;
    const computedAvgOrderValue =
      stats.totalOrders > 0 ? stats.totalRevenue / stats.totalOrders : 0;
    return { completionRate, computedAvgOrderValue };
  }, [stats]);

  const LinearChart = ({ data, color, height = 60 }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((value - min) / range) * 100;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg
        className="linear-chart"
        width="100%"
        height={height}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
        <defs>
          <linearGradient
            id={`gradient-${color.replace("#", "")}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <polygon
          fill={`url(#gradient-${color.replace("#", "")})`}
          points={`0,100 ${points} 100,100`}
        />
      </svg>
    );
  };

  const ProgressRing = ({ value }) => {
    const clamped = Math.max(0, Math.min(1, Number(value || 0)));
    const size = 88;
    const stroke = 10;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const dash = clamped * circumference;
    return (
      <svg
        className="ring"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className="ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className="ring-fg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="ring-text"
        >
          {formatters.percent.format(clamped)}
        </text>
      </svg>
    );
  };

  const DonutChart = ({ completed, pending }) => {
    const total = Math.max(0, Number(completed || 0) + Number(pending || 0));
    const size = 88;
    const stroke = 12;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const completedFrac = total > 0 ? completed / total : 0;
    const completedDash = completedFrac * circumference;
    return (
      <svg
        className="donut"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className="donut-pending"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
        />
        <circle
          className="donut-completed"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={`${completedDash} ${circumference - completedDash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="donut-text"
        >
          {formatters.percent.format(completedFrac)}
        </text>
      </svg>
    );
  };

  const BarCompare = ({ a, b, aLabel, bLabel }) => {
    const aNum = Math.max(0, Number(a || 0));
    const bNum = Math.max(0, Number(b || 0));
    const total = aNum + bNum;
    const aPct = total > 0 ? aNum / total : 0;
    const bPct = total > 0 ? bNum / total : 0;
    return (
      <div className="bar-compare" aria-hidden="true">
        <div className="bar">
          <div className="bar-a" style={{ width: `${aPct * 100}%` }} />
          <div className="bar-b" style={{ width: `${bPct * 100}%` }} />
        </div>
        <div className="bar-legend">
          <span className="legend-a">{aLabel}</span>
          <span className="legend-b">{bLabel}</span>
        </div>
      </div>
    );
  };

  // Generate sample data for linear charts
  const generateChartData = (baseValue, variation = 0.3) => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      const variationAmount = baseValue * variation * (Math.random() - 0.5);
      data.push(Math.max(0, baseValue + variationAmount));
    }
    return data;
  };

  return (
    <div className="balance-container">
      {!stats ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="balance-grid">
          {/* Balance Overview Section */}
          <div className="dashboard-section">
            <h2 className="section-title">
              <i className="fa-solid fa-wallet" /> Balance Overview
            </h2>
            <div className="section-grid">
              <div
                className="stat-card accent-primary"
                title="Your available funds ready for withdrawal"
                aria-label="Available Balance"
              >
                <div className="stat-title">
                  <i className="fa-solid fa-wallet" /> Available Balance
                </div>
                <div className="stat-value">
                  {formatters.currency.format(stats.actualBalance)}
                </div>
                <div className="stat-subtitle">Ready to withdraw</div>
                <div className="chart-container">
                  <LinearChart
                    data={generateChartData(stats.actualBalance)}
                    color="#5c8dff"
                  />
                </div>
              </div>

              <div
                className="stat-card accent-warning"
                title="Funds temporarily held for security or compliance"
                aria-label="Held Balance"
              >
                <div className="stat-title">
                  <i className="fa-solid fa-hand" /> Held Balance
                </div>
                <div className="stat-value">
                  {formatters.currency.format(stats.suspendedBalance)}
                </div>
                <div className="stat-subtitle">Under review</div>
                <div className="chart-container">
                  <LinearChart
                    data={generateChartData(stats.suspendedBalance)}
                    color="#ffb74d"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Performance Section */}
          <div className="dashboard-section">
            <h2 className="section-title">
              <i className="fa-solid fa-chart-line" /> Order Performance
            </h2>
            <div className="section-grid">
              <div
                className="stat-card"
                title="Total orders you've created"
                aria-label="Total Orders"
              >
                <div className="stat-title">
                  <i className="fa-solid fa-boxes-stacked" /> Total Orders
                </div>
                <div className="stat-value">
                  {formatters.number.format(stats.totalOrders)}
                </div>
                <div className="stat-subtitle">All time</div>
                <div className="chart-container">
                  <LinearChart
                    data={generateChartData(stats.totalOrders, 0.2)}
                    color="#8b5cf6"
                  />
                </div>
              </div>

              <div
                className="stat-card"
                title="Orders you've successfully completed"
                aria-label="Completed Orders"
              >
                <div className="stat-title">
                  <i className="fa-solid fa-circle-check" /> Completed
                </div>
                <div className="stat-row">
                  <span className="stat-value">
                    {formatters.number.format(stats.completedOrders)}
                  </span>
                  <span className="stat-chip success">done</span>
                </div>
                <div className="stat-subtitle">Successfully finished</div>
                <div className="chart-container">
                  <LinearChart
                    data={generateChartData(stats.completedOrders, 0.2)}
                    color="#2be49f"
                  />
                </div>
              </div>

              <div
                className="stat-card"
                title="Orders waiting for completion"
                aria-label="Pending Orders"
              >
                <div className="stat-title">
                  <i className="fa-solid fa-hourglass-half" /> Pending
                </div>
                <div className="stat-row">
                  <span className="stat-value">
                    {formatters.number.format(stats.pendingOrders)}
                  </span>
                  <span className="stat-chip warning">pending</span>
                </div>
                <div className="stat-subtitle">Awaiting completion</div>
                <div className="chart-container">
                  <LinearChart
                    data={generateChartData(stats.pendingOrders, 0.2)}
                    color="#ffb74d"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics Section */}
          <div className="dashboard-section">
            <h2 className="section-title">
              <i className="fa-solid fa-gauge-high" /> Performance Metrics
            </h2>
            <div className="section-grid">
              <div
                className="stat-card"
                title="Your average earnings per order"
                aria-label="Average Order Value"
              >
                <div className="stat-title">
                  <i className="fa-solid fa-receipt" /> Avg Order Value
                </div>
                <div className="stat-value">
                  {formatters.currency.format(stats.averageOrderValue)}
                </div>
                <div className="stat-subtitle">Per order</div>
                <div className="chart-container">
                  <LinearChart
                    data={generateChartData(stats.averageOrderValue)}
                    color="#06b6d4"
                  />
                </div>
              </div>

              <div
                className="stat-card"
                title="Percentage of orders you complete successfully"
                aria-label="Success Rate"
              >
                <div className="stat-title">
                  <i className="fa-solid fa-gauge-high" /> Success Rate
                </div>
                <div className="stat-visual">
                  <ProgressRing value={derived?.completionRate || 0} />
                </div>
                <div className="stat-subtitle">Completed ÷ Total</div>
              </div>

              <div
                className="stat-card"
                title="When you last created an order"
                aria-label="Last Activity"
              >
                <div className="stat-title">
                  <i className="fa-regular fa-clock" /> Last Activity
                </div>
                <div className="stat-value">
                  {stats.lastOrderDate
                    ? formatters.date.format(stats.lastOrderDate)
                    : "—"}
                </div>
                <div className="stat-subtitle">Most recent order</div>
              </div>
            </div>
          </div>

          {/* Visual Analytics Section */}
          <div className="dashboard-section">
            <h2 className="section-title">
              <i className="fa-solid fa-chart-pie" /> Analytics
            </h2>
            <div className="section-grid">
              <div
                className="stat-card"
                title="Visual breakdown of your order completion status"
                aria-label="Order Status Breakdown"
              >
                <div className="stat-title">
                  <i className="fa-solid fa-chart-pie" /> Order Status
                </div>
                <div className="stat-visual">
                  <DonutChart
                    completed={stats.completedOrders}
                    pending={stats.pendingOrders - stats.completedOrders}
                  />
                </div>
                <div className="stat-subtitle">Completed vs Pending</div>
              </div>

              <div
                className="stat-card"
                title="Visual comparison of your available vs held funds"
                aria-label="Balance Distribution"
              >
                <div className="stat-title">
                  <i className="fa-solid fa-chart-column" /> Balance Split
                </div>
                <BarCompare
                  a={stats.actualBalance}
                  b={stats.suspendedBalance}
                  aLabel={`Available ${formatters.currency.format(
                    stats.actualBalance
                  )}`}
                  bLabel={`Held ${formatters.currency.format(
                    stats.suspendedBalance
                  )}`}
                />
                <div className="stat-subtitle">Available vs Held</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brokers Leaderboard */}
      <BrokersArrangement />
    </div>
  );
};

export default Balance;
