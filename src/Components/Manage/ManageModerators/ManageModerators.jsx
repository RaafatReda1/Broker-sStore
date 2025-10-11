import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import supabase from "../../../SupabaseClient";
import { toast } from "react-toastify";
import "./ManageModerators.css";

const ManageModerators = () => {
  const { t } = useTranslation();
  const [moderators, setModerators] = useState([]);
  const [form, setForm] = useState({
    id: null,
    name: "",
    email: "",
    authority: "moderator",
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");

  // Check if moderator is active (logged in within last 30 days)
  const isModeratorActive = (lastLogin) => {
    if (!lastLogin) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(lastLogin) > thirtyDaysAgo;
  };

  // Get activity status with color coding
  const getActivityStatus = (lastLogin) => {
    if (!lastLogin) {
      return {
        text: t("manageModerators.neverLoggedIn"),
        class: "status-never",
        icon: "⭕",
      };
    }

    const now = new Date();
    const loginDate = new Date(lastLogin);
    const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
    const daysDiff = hoursDiff / 24;

    if (hoursDiff < 24) {
      return {
        text: t("manageModerators.activeToday"),
        class: "status-active-today",
        icon: "🟢",
      };
    } else if (daysDiff < 7) {
      return {
        text: t("manageModerators.activeThisWeek"),
        class: "status-active-week",
        icon: "🟡",
      };
    } else if (daysDiff < 30) {
      return {
        text: t("manageModerators.activeThisMonth"),
        class: "status-active-month",
        icon: "🟠",
      };
    } else {
      return {
        text: t("manageModerators.inactive"),
        class: "status-inactive",
        icon: "🔴",
      };
    }
  };

  // Format relative time
  const getRelativeTime = (date) => {
    if (!date) return t("manageModerators.never");

    const now = new Date();
    const loginDate = new Date(date);
    const diffMs = now - loginDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t("manageModerators.justNow");
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return loginDate.toLocaleDateString();
  };

  // Fetch moderators with real-time activity check
  const fetchModerators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("Staff")
        .select("*")
        .eq("authority", "moderator")
        .order("last_login", { ascending: false, nullsFirst: false });

      if (error) throw error;
      setModerators(data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerators();

    // Auto-refresh every 60 seconds to keep activity status updated
    const interval = setInterval(() => {
      fetchModerators();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Add or Update Moderator
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.name.trim() || !form.email.trim()) {
        toast.error("⚠️ Please fill in all fields");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        toast.error("⚠️ Please enter a valid email address");
        return;
      }

      if (form.id) {
        // Update existing
        const { error } = await supabase
          .from("Staff")
          .update({
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
          })
          .eq("id", form.id);

        if (error) throw error;
        toast.success("✅ Moderator updated successfully");
      } else {
        // Check if email already exists
        const { data: existingUser } = await supabase
          .from("Staff")
          .select("email")
          .eq("email", form.email.trim().toLowerCase())
          .single();

        if (existingUser) {
          toast.error("⚠️ A moderator with this email already exists");
          return;
        }

        // Add new
        const { error } = await supabase.from("Staff").insert([
          {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            authority: "moderator",
            created_at: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
        toast.success("🎉 Moderator added successfully");
      }

      await fetchModerators();
      resetForm();
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete moderator
  const handleDelete = async (id, name) => {
    if (
      !window.confirm(
        `⚠️ Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`
      )
    )
      return;

    setLoading(true);
    try {
      const { error } = await supabase.from("Staff").delete().eq("id", id);

      if (error) throw error;
      toast.success("🗑️ Moderator deleted successfully");
      await fetchModerators();
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Edit existing moderator
  const handleEdit = (mod) => {
    setForm({
      id: mod.id,
      name: mod.name,
      email: mod.email,
      authority: mod.authority,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset form
  const resetForm = () => {
    setForm({
      id: null,
      name: "",
      email: "",
      authority: "moderator",
    });
  };

  // Calculate stats
  const stats = {
    total: moderators.length,
    activeToday: moderators.filter((m) => {
      if (!m.last_login) return false;
      const hours = (new Date() - new Date(m.last_login)) / (1000 * 60 * 60);
      return hours < 24;
    }).length,
    activeThisWeek: moderators.filter((m) => {
      if (!m.last_login) return false;
      const days =
        (new Date() - new Date(m.last_login)) / (1000 * 60 * 60 * 24);
      return days < 7;
    }).length,
    neverLoggedIn: moderators.filter((m) => !m.last_login).length,
  };

  // Filter moderators based on search and activity
  const filteredModerators = moderators.filter((mod) => {
    const matchesSearch =
      mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mod.id.toString().includes(searchTerm);

    const matchesFilter =
      filterActive === "all" ||
      (filterActive === "active" && isModeratorActive(mod.last_login)) ||
      (filterActive === "inactive" && !isModeratorActive(mod.last_login));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="moderators-container">
      <div className="moderators-card">
        <div className="moderators-header">
          <h1>
            <span className="header-icon">👥</span>
            {t("manageModerators.title")}
          </h1>
          <p>{t("manageModerators.subtitle")}</p>
        </div>

        <div className="moderators-content">
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-card stat-card-total">
              <div className="stat-icon">📊</div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">
                {t("manageModerators.totalModerators")}
              </div>
            </div>
            <div className="stat-card stat-card-today">
              <div className="stat-icon">🟢</div>
              <div className="stat-value">{stats.activeToday}</div>
              <div className="stat-label">
                {t("manageModerators.activeToday")}
              </div>
            </div>
            <div className="stat-card stat-card-week">
              <div className="stat-icon">📅</div>
              <div className="stat-value">{stats.activeThisWeek}</div>
              <div className="stat-label">
                {t("manageModerators.activeThisWeek")}
              </div>
            </div>
            <div className="stat-card stat-card-never">
              <div className="stat-icon">⭕</div>
              <div className="stat-value">{stats.neverLoggedIn}</div>
              <div className="stat-label">
                {t("manageModerators.neverLoggedIn")}
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          <div className="form-section">
            <div className="form-title">
              <span>{form.id ? "✏️" : "➕"}</span>
              {form.id
                ? t("manageModerators.editModerator")
                : t("manageModerators.addNewModerator")}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  {t("manageModerators.fullName")}
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder={t("manageModerators.enterFullName")}
                  value={form.name}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {t("manageModerators.emailAddress")}
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder={t("manageModerators.emailPlaceholder")}
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                onClick={handleSubmit}
                className="manage-moderators-btn manage-moderators-btn-primary"
                disabled={loading}
              >
                {loading
                  ? t("common.processing")
                  : form.id
                  ? t("manageModerators.updateModerator")
                  : t("manageModerators.addModerator")}
              </button>
              {form.id && (
                <button
                  onClick={resetForm}
                  className="manage-moderators-btn manage-moderators-btn-secondary"
                >
                  {t("common.cancel")}
                </button>
              )}
            </div>
          </div>

          {/* Search and Filter */}
          <div className="search-filter-section">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder={t("manageModerators.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="search-clear"
                  onClick={() => setSearchTerm("")}
                  title={t("manageModerators.clearSearch")}
                >
                  ✕
                </button>
              )}
            </div>
            <div className="filter-buttons">
              <button
                className={`filter-btn ${
                  filterActive === "all" ? "active" : ""
                }`}
                onClick={() => setFilterActive("all")}
              >
                All ({moderators.length})
              </button>
              <button
                className={`filter-btn ${
                  filterActive === "active" ? "active" : ""
                }`}
                onClick={() => setFilterActive("active")}
              >
                Active (
                {
                  moderators.filter((m) => isModeratorActive(m.last_login))
                    .length
                }
                )
              </button>
              <button
                className={`filter-btn ${
                  filterActive === "inactive" ? "active" : ""
                }`}
                onClick={() => setFilterActive("inactive")}
              >
                Inactive (
                {
                  moderators.filter((m) => !isModeratorActive(m.last_login))
                    .length
                }
                )
              </button>
            </div>
          </div>

          {/* Moderators Table */}
          <div className="table-container">
            <table className="moderators-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Activity Status</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredModerators.length > 0 ? (
                  filteredModerators.map((mod) => {
                    const status = getActivityStatus(mod.last_login);
                    return (
                      <tr key={mod.id}>
                        <td>
                          <span className="id-badge">#{mod.id}</span>
                        </td>
                        <td>
                          <div className="name-cell">{mod.name}</div>
                        </td>
                        <td>
                          <div className="email-cell">{mod.email}</div>
                        </td>
                        <td>
                          <span className={`status-badge ${status.class}`}>
                            <span className="status-icon">{status.icon}</span>
                            {status.text}
                          </span>
                        </td>
                        <td>
                          <div className="time-cell">
                            <div className="relative-time">
                              {getRelativeTime(mod.last_login)}
                            </div>
                            {mod.last_login && (
                              <div className="absolute-time">
                                {new Date(mod.last_login).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEdit(mod)}
                              className="manage-moderators-btn-edit"
                              title={t("manageModerators.editModerator")}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(mod.id, mod.name)}
                              className="manage-moderators-btn-delete"
                              title={t("manageModerators.deleteModerator")}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6">
                      <div className="empty-state">
                        <div className="empty-state-icon">
                          {searchTerm || filterActive !== "all" ? "🔍" : "📭"}
                        </div>
                        <div className="empty-state-text">
                          {searchTerm || filterActive !== "all"
                            ? t("manageModerators.noModeratorsFound")
                            : t("manageModerators.noModeratorsYet")}
                        </div>
                        <div className="empty-state-subtext">
                          {searchTerm || filterActive !== "all"
                            ? t("manageModerators.tryAdjustingSearch")
                            : t("manageModerators.addFirstModerator")}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <div className="loading-text">Processing...</div>
        </div>
      )}
    </div>
  );
};

export default ManageModerators;
