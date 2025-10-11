/* eslint-disable react/prop-types */
import { useContext, useMemo } from "react";
import React from "react";
import { useTranslation } from "react-i18next";

import "./Balance.css";
import { userDataContext } from "../../AppContexts";
import BrokersArrangement from "./BrokersArrangement/BrokersArrangement";

const Balance = () => {
  const { t } = useTranslation();
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
        <div className="loading">{t("common.loading")}</div>
      ) : (
        <div className="balance-grid">
          {/* Balance Overview Section */}
          <div className="dashboard-section">
            <h2 className="section-title">
              <i className="fa-solid fa-wallet" />{" "}
              {t("balance.balanceOverview")}
            </h2>
            <div className="section-grid">
              <div
                className="stat-card accent-primary"
                title={t("balance.availableFundsTooltip")}
                aria-label={t("balance.availableBalance")}
              >
                <div className="stat-title">
                  <i className="fa-solid fa-wallet" />{" "}
                  {t("balance.availableBalance")}
                </div>
                <div className="stat-value">
                  {formatters.currency.format(stats.actualBalance)}
                </div>
                <div className="stat-subtitle">
                  {t("balance.readyToWithdraw")}
                </div>
                <div className="chart-container">
                  <LinearChart
                    data={generateChartData(stats.actualBalance)}
                    color="#5c8dff"
                  />
                </div>
              </div>

              <div
                className="stat-card accent-warning"
                title={t("balance.heldFundsTooltip")}
                aria-label={t("balance.heldBalance")}
              >
                <div className="stat-title">
                  <i className="fa-solid fa-hand" /> {t("balance.heldBalance")}
                </div>
                <div className="stat-value">
                  {formatters.currency.format(stats.suspendedBalance)}
                </div>
                <div className="stat-subtitle">{t("balance.underReview")}</div>
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
              <i className="fa-solid fa-chart-line" />{" "}
              {t("balance.orderPerformance")}
            </h2>
            <div className="section-grid">
              <div
                className="stat-card"
                title={t("balance.totalOrdersTooltip")}
                aria-label={t("balance.totalOrders")}
              >
                <div className="stat-title">
                  <i className="fa-solid fa-boxes-stacked" />{" "}
                  {t("balance.totalOrders")}
                </div>
                <div className="stat-value">
                  {formatters.number.format(stats.totalOrders)}
                </div>
                <div className="stat-subtitle">{t("balance.allTime")}</div>
                <div className="chart-container">
                  <LinearChart
                    data={generateChartData(stats.totalOrders, 0.2)}
                    color="#8b5cf6"
                  />
                </div>
              </div>

              <div
                className="stat-card"
                title={t("balance.completedOrdersTooltip")}
                aria-label={t("balance.completed")}
              >
                <div className="stat-title">
                  <i className="fa-solid fa-circle-check" />{" "}
                  {t("balance.completed")}
                </div>
                <div className="stat-row">
                  <span className="stat-value">
                    {formatters.number.format(stats.completedOrders)}
                  </span>
                  <span className="stat-chip success">{t("balance.done")}</span>
                </div>
                <div className="stat-subtitle">
                  {t("balance.successfullyFinished")}
                </div>
                <div className="chart-container">
                  <LinearChart
                    data={generateChartData(stats.completedOrders, 0.2)}
                    color="#2be49f"
                  />
                </div>
              </div>

              <div
                className="stat-card"
                title={t("balance.pendingOrdersTooltip")}
                aria-label={t("balance.pending")}
              >
                <div className="stat-title">
                  <i className="fa-solid fa-hourglass-half" />{" "}
                  {t("balance.pending")}
                </div>
                <div className="stat-row">
                  <span className="stat-value">
                    {formatters.number.format(stats.pendingOrders)}
                  </span>
                  <span className="stat-chip warning">
                    {t("balance.pending")}
                  </span>
                </div>
                <div className="stat-subtitle">
                  {t("balance.awaitingCompletion")}
                </div>
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
              <i className="fa-solid fa-gauge-high" />{" "}
              {t("balance.performanceMetrics")}
            </h2>
            <div className="section-grid">
              <div
                className="stat-card"
                title={t("balance.avgOrderValueTooltip")}
                aria-label={t("balance.avgOrderValue")}
              >
                <div className="stat-title">
                  <i className="fa-solid fa-receipt" />{" "}
                  {t("balance.avgOrderValue")}
                </div>
                <div className="stat-value">
                  {formatters.currency.format(stats.averageOrderValue)}
                </div>
                <div className="stat-subtitle">{t("balance.perOrder")}</div>
                <div className="chart-container">
                  <LinearChart
                    data={generateChartData(stats.averageOrderValue)}
                    color="#06b6d4"
                  />
                </div>
              </div>

              <div
                className="stat-card"
                title={t("balance.successRateTooltip")}
                aria-label={t("balance.successRate")}
              >
                <div className="stat-title">
                  <i className="fa-solid fa-gauge-high" />{" "}
                  {t("balance.successRate")}
                </div>
                <div className="stat-visual">
                  <ProgressRing value={derived?.completionRate || 0} />
                </div>
                <div className="stat-subtitle">
                  {t("balance.completedDividedTotal")}
                </div>
              </div>

              <div
                className="stat-card"
                title={t("balance.lastActivityTooltip")}
                aria-label={t("balance.lastActivity")}
              >
                <div className="stat-title">
                  <i className="fa-regular fa-clock" />{" "}
                  {t("balance.lastActivity")}
                </div>
                <div className="stat-value">
                  {stats.lastOrderDate
                    ? formatters.date.format(stats.lastOrderDate)
                    : "—"}
                </div>
                <div className="stat-subtitle">
                  {t("balance.mostRecentOrder")}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Analytics Section */}
          <div className="dashboard-section">
            <h2 className="section-title">
              <i className="fa-solid fa-chart-pie" /> {t("balance.analytics")}
            </h2>
            <div className="section-grid">
              <div
                className="stat-card"
                title={t("balance.orderStatusTooltip")}
                aria-label={t("balance.orderStatus")}
              >
                <div className="stat-title">
                  <i className="fa-solid fa-chart-pie" />{" "}
                  {t("balance.orderStatus")}
                </div>
                <div className="stat-visual">
                  <DonutChart
                    completed={stats.completedOrders}
                    pending={stats.pendingOrders - stats.completedOrders}
                  />
                </div>
                <div className="stat-subtitle">
                  {t("balance.completedVsPending")}
                </div>
              </div>

              <div
                className="stat-card"
                title={t("balance.balanceDistributionTooltip")}
                aria-label={t("balance.balanceSplit")}
              >
                <div className="stat-title">
                  <i className="fa-solid fa-chart-column" />{" "}
                  {t("balance.balanceSplit")}
                </div>
                <BarCompare
                  a={stats.actualBalance}
                  b={stats.suspendedBalance}
                  aLabel={`${t(
                    "balance.available"
                  )} ${formatters.currency.format(stats.actualBalance)}`}
                  bLabel={`${t("balance.held")} ${formatters.currency.format(
                    stats.suspendedBalance
                  )}`}
                />
                <div className="stat-subtitle">
                  {t("balance.availableVsHeld")}
                </div>
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
