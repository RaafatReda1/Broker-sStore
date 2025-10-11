import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { staffContext } from "../../../AppContexts";
import { Link } from "react-router-dom";
import "./ManagingDashboard.css";

// ✅ FontAwesome Imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserTie,
  faBox,
  faCubes,
  faUsersGear,
  faRightFromBracket,
  faBell,
  faMoneyBill,
  faMoneyBillTransfer, // logout icon
} from "@fortawesome/free-solid-svg-icons";
import supabase from "../../../SupabaseClient";
import { faComment } from "@fortawesome/free-solid-svg-icons/faComment";

const ManagingDashboard = () => {
  const { t } = useTranslation();
  const { isAdmin, isModerator } = useContext(staffContext);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.log("LoggingOut Err: " + err.message);
    }
  };

  return (
    <div className="managing-dashboard">
      <h2 className="dashboard-title">{t("admin.dashboard")}</h2>

      <Link to="/manageOrders" className="dashboard-item">
        <FontAwesomeIcon icon={faBox} className="icon" />
        <span>{t("admin.manageOrders")}</span>
      </Link>

      <Link to="/manageBrokers" className="dashboard-item">
        <FontAwesomeIcon icon={faUserTie} className="icon" />
        <span>{t("admin.manageBrokers")}</span>
      </Link>

      {isAdmin && (
        <>
          <Link to="/manageProducts" className="dashboard-item">
            <FontAwesomeIcon icon={faCubes} className="icon" />
            <span>{t("admin.manageProducts")}</span>
          </Link>

          <Link to="/manageModerators" className="dashboard-item">
            <FontAwesomeIcon icon={faUsersGear} className="icon" />
            <span>{t("admin.manageModerators")}</span>
          </Link>
          <Link to="/manageWithdrawals" className="dashboard-item">
            <FontAwesomeIcon icon={faMoneyBillTransfer} className="icon" />
            <span>{t("admin.manageWithdrawals")}</span>
          </Link>
        </>
      )}
      <Link to="/manageNotifications" className="dashboard-item">
        <FontAwesomeIcon icon={faComment} className="icon" />
        <span>{t("admin.manageNotifications")}</span>
      </Link>

      <a className="dashboard-logout dashboard-item" onClick={handleLogout}>
        <FontAwesomeIcon
          icon={faRightFromBracket}
          className="icon logout-icon"
        />
        <span>{t("common.logout")}</span>
      </a>
    </div>
  );
};

export default ManagingDashboard;
