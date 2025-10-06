import React, { useEffect, useState } from "react";
import supabase from "../../../SupabaseClient";
import ViewImages from "./ViewImages/ViewImages";
import ViewStatistics from "./ViewStatistics/ViewStatistics";
import "./ManageBrokers.css";

const ManageBrokers = () => {
  const [brokers, setBrokers] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [showImages, setShowImages] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // 🔹 Fetch brokers from DB
  const fetchBrokers = async () => {
    const { data, error } = await supabase.from("Brokers").select("*");
    if (error) {
      console.error("Error fetching brokers:", error);
    } else if (data) {
      setBrokers(data);
      console.log("Fetched brokers:", data);
    }
  };

  // 🔹 Update verification status
  const updateVerificationStatus = async (brokerId, isVerified) => {
    try {
      const { error } = await supabase
        .from("Brokers")
        .update({ isVerified })
        .eq("id", brokerId);

      if (error) throw error;

      // ✅ Update the state locally without refetching everything
      setBrokers((prev) =>
        prev.map((b) => (b.id === brokerId ? { ...b, isVerified } : b))
      );

      console.log("Verification status updated successfully");
    } catch (error) {
      console.error("Error updating verification status:", error);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  // Filter brokers
  const filteredBrokers = brokers.filter((broker) => {
    const matchesSearch =
      broker.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.phone?.includes(searchTerm);

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "verified" && broker.isVerified) ||
      (filterStatus === "unverified" && !broker.isVerified);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="manage-brokers-container">
      <div className="header-section">
        <h1 className="page-title">
          <span className="title-icon">👥</span>
          Manage Brokers
        </h1>
        <div className="broker-stats">
          <div className="stat-badge">
            <span className="stat-label">Total</span>
            <span className="stat-value">{brokers.length}</span>
          </div>
          <div className="stat-badge verified">
            <span className="stat-label">Verified</span>
            <span className="stat-value">
              {brokers.filter((b) => b.isVerified).length}
            </span>
          </div>
          <div className="stat-badge unverified">
            <span className="stat-label">Pending</span>
            <span className="stat-value">
              {brokers.filter((b) => !b.isVerified).length}
            </span>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-buttons">
          <button
            className={filterStatus === "all" ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilterStatus("all")}
          >
            All
          </button>
          <button
            className={filterStatus === "verified" ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilterStatus("verified")}
          >
            Verified
          </button>
          <button
            className={filterStatus === "unverified" ? "filter-btn active" : "filter-btn"}
            onClick={() => setFilterStatus("unverified")}
          >
            Pending
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="brokers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Broker</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredBrokers.length === 0 ? (
              <tr>
                <td colSpan="5" className="no-results">
                  <span className="no-results-icon">🔍</span>
                  <p>No brokers found</p>
                </td>
              </tr>
            ) : (
              filteredBrokers.map((broker) => (
                <tr key={broker.id} className="broker-row">
                  <td className="id-cell">#{broker.id}</td>

                  <td className="broker-cell">
                    <div className="broker-info">
                      <div className="avatar-wrapper">
                        {broker.avatar_url ? (
                          <img
                            src={broker.avatar_url}
                            alt="Avatar"
                            className="broker-avatar"
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {broker.fullName?.charAt(0).toUpperCase() || "?"}
                          </div>
                        )}
                      </div>
                      <span className="broker-name">{broker.fullName}</span>
                    </div>
                  </td>

                  <td className="contact-cell">
                    <div className="contact-info">
                      <span className="contact-item">
                        <span className="contact-icon">📧</span>
                        {broker.email}
                      </span>
                      <span className="contact-item">
                        <span className="contact-icon">📱</span>
                        {broker.phone}
                      </span>
                    </div>
                  </td>

                  <td className="status-cell">
                    <button
                      onClick={() =>
                        updateVerificationStatus(broker.id, !broker.isVerified)
                      }
                      className={
                        broker.isVerified
                          ? "status-btn verified"
                          : "status-btn unverified"
                      }
                    >
                      <span className="status-icon">
                        {broker.isVerified ? "✓" : "⏳"}
                      </span>
                      {broker.isVerified ? "Verified" : "Pending"}
                    </button>
                  </td>

                  <td className="actions-cell">
                    <div className="action-buttons">
                      <button
                        onClick={() => {
                          setSelectedBroker(broker);
                          setShowImages(true);
                        }}
                        className="action-btn images-btn"
                        title="View ID Images"
                      >
                        <span className="btn-icon">🖼️</span>
                        <span className="btn-text">Images</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedBroker(broker);
                          setShowStatistics(true);
                        }}
                        className="action-btn stats-btn"
                        title="View Statistics"
                      >
                        <span className="btn-icon">📊</span>
                        <span className="btn-text">Stats</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Popup Components */}
      {showImages && selectedBroker && (
        <ViewImages
          broker={selectedBroker}
          onClose={() => setSelectedBroker(null)}
          show={{ showImages, setShowImages }}
        />
      )}

      {showStatistics && selectedBroker && (
        <ViewStatistics
          broker={selectedBroker}
          onClose={() => setSelectedBroker(null)}
          show={{ showStatistics, setShowStatistics }}
        />
      )}
    </div>
  );
};

export default ManageBrokers;