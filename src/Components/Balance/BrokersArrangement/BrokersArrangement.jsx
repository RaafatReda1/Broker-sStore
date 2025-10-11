import { useState, useContext, useCallback, useMemo } from "react";
import React from "react";
import { useTranslation } from "react-i18next";

import "./BrokersArrangement.css";
import { userDataContext, sessionContext } from "../../../AppContexts";
import supabase from "../../../SupabaseClient";
import { toast } from "react-toastify";

const BrokersArrangement = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { userData } = useContext(userDataContext);
  const { session } = useContext(sessionContext);

  // Fetch all brokers data
  const fetchBrokers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("Brokers")
        .select(
          "id, fullName, nickName, avatar_url, totalRevenue, actualBalance"
        )
        .order("totalRevenue", { ascending: false });

      if (error) {
        console.error("Error fetching brokers:", error);
        toast.error(t("errors.failedToLoadLeaderboard"));
        return;
      }

      if (data) {
        setBrokers(data);
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error(t("errors.failedToLoadLeaderboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Open popup and fetch data
  const handleOpenPopup = useCallback(() => {
    setIsOpen(true);
    if (brokers.length === 0) {
      fetchBrokers();
    }
  }, [brokers.length, fetchBrokers]);

  // Close popup
  const handleClosePopup = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Get current user's rank
  const getCurrentUserRank = useCallback(() => {
    if (!userData) return null;
    return brokers.findIndex((broker) => broker.id === userData.id) + 1;
  }, [brokers, userData]);

  // Format currency
  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }, []);

  // Get rank badge class
  const getRankBadgeClass = useCallback((rank) => {
    if (rank === 1) return "rank-gold";
    if (rank === 2) return "rank-silver";
    if (rank === 3) return "rank-bronze";
    return "rank-other";
  }, []);

  // Get rank icon
  const getRankIcon = useCallback((rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  }, []);

  // Get top 10 brokers
  const top10Brokers = useMemo(() => {
    return brokers.slice(0, 10);
  }, [brokers]);

  // Check if current user is in top 10
  const isCurrentUserInTop10 = useMemo(() => {
    if (!userData) return false;
    return top10Brokers.some((broker) => broker.id === userData.id);
  }, [top10Brokers, userData]);

  // Get current user's detailed rank info
  const currentUserRankInfo = useMemo(() => {
    if (!userData) return null;
    const userIndex = brokers.findIndex((broker) => broker.id === userData.id);
    return {
      rank: userIndex + 1,
      broker: brokers[userIndex],
      isInTop10: userIndex < 10,
    };
  }, [brokers, userData]);

  if (!session || !userData) {
    return null; // Don't show for non-authenticated users
  }

  return (
    <>
      {/* Trigger Button */}
      <button className="leaderboard-btn" onClick={handleOpenPopup}>
        <i className="fa-solid fa-trophy" />
        {t("balance.viewLeaderboard")}
      </button>

      {/* Popup Overlay */}
      {isOpen && (
        <div className="leaderboard-overlay" onClick={handleClosePopup}>
          <div
            className="leaderboard-popup"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="leaderboard-header">
              <h2>
                <i className="fa-solid fa-trophy" />
                {t("balance.brokersLeaderboard")}
              </h2>
              <button
                className="brokers-arrangement-close-btn"
                onClick={handleClosePopup}
              >
                ✕
              </button>
            </div>

            {/* Current User Status */}
            {userData && currentUserRankInfo && (
              <div className="current-user-status">
                <div className="current-user-card">
                  <div className="current-user-avatar">
                    {userData.avatar_url ? (
                      <img src={userData.avatar_url} alt={userData.fullName} />
                    ) : (
                      <i className="fa-solid fa-user-tie" />
                    )}
                  </div>
                  <div className="current-user-info">
                    <h4>{userData.fullName}</h4>
                    <div className="rank-display">
                      <span
                        className={`rank-badge ${getRankBadgeClass(
                          currentUserRankInfo.rank
                        )}`}
                      >
                        {getRankIcon(currentUserRankInfo.rank)}
                      </span>
                      <span className="rank-text">
                        {t("balance.yourRank")}: #{currentUserRankInfo.rank}
                      </span>
                    </div>
                    <div className="revenue-display">
                      <span className="current-user-revenue">
                        {formatCurrency(userData.totalRevenue)}
                      </span>
                      <span className="revenue-label">
                        {t("balance.totalRevenue")}
                      </span>
                    </div>
                    {!currentUserRankInfo.isInTop10 && (
                      <div className="motivation-text">
                        <i className="fa-solid fa-rocket" />
                        {t("balance.climbLeaderboard")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard List */}
            <div className="leaderboard-content">
              {loading ? (
                <div className="loading">
                  <i className="fa-solid fa-spinner fa-spin" />
                  {t("common.loading")} {t("balance.leaderboard")}...
                </div>
              ) : (
                <div className="brokers-list">
                  <div className="top10-header">
                    <h3>
                      <i className="fa-solid fa-crown" />
                      {t("balance.top10Brokers")}
                    </h3>
                  </div>
                  {top10Brokers.map((broker, index) => {
                    const rank = index + 1;
                    const isCurrentUser = userData && broker.id === userData.id;

                    return (
                      <div
                        key={broker.id}
                        className={`broker-item ${getRankBadgeClass(rank)} ${
                          isCurrentUser ? "current-user" : ""
                        }`}
                      >
                        <div className="broker-rank">
                          <span className="rank-badge">
                            {getRankIcon(rank)}
                          </span>
                        </div>

                        <div className="broker-avatar">
                          {broker.avatar_url ? (
                            <img
                              src={broker.avatar_url}
                              alt={broker.fullName}
                            />
                          ) : (
                            <i className="fa-solid fa-user-tie" />
                          )}
                        </div>

                        <div className="broker-info">
                          <h4>{broker.fullName}</h4>
                          <p>@{broker.nickName}</p>
                        </div>

                        <div className="broker-revenue">
                          <span className="revenue-amount">
                            {formatCurrency(broker.totalRevenue)}
                          </span>
                          <span className="revenue-label">
                            {t("balance.totalRevenue")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="leaderboard-footer">
              <p>
                <i className="fa-solid fa-info-circle" />
                {t("balance.leaderboardInfo")}
              </p>
              {currentUserRankInfo && !currentUserRankInfo.isInTop10 && (
                <p className="motivation-footer">
                  <i className="fa-solid fa-chart-line" />
                  {t("balance.keepClimbing")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(BrokersArrangement);
