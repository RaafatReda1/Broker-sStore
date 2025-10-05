import React, { useContext } from "react";
import { staffContext } from "../../../AppContexts";
import { Link } from "react-router-dom";
import "./ManagingDashboard.css";

// ✅ FontAwesome React Imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserTie,
  faBox,
  faCubes,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import supabase from "../../../SupabaseClient";

const ManagingDashboard = () => {
  const { isAdmin, isModerator } = useContext(staffContext);

  return (
    <div className="managing-dashboard">
      <h2 className="dashboard-title">Manage</h2>

      <Link to="/manageOrders" className="dashboard-item">
        <FontAwesomeIcon icon={faBox} className="icon" />
        <span>Orders</span>
      </Link>

      <Link to="/manageBrokers" className="dashboard-item">
        <FontAwesomeIcon icon={faUserTie} className="icon" />
        <span>Brokers</span>
      </Link>

      {isAdmin && (
        <>
          <Link to="/manageProducts" className="dashboard-item">
            <FontAwesomeIcon icon={faCubes} className="icon" />
            <span>Products</span>
          </Link>

          <Link to="/manageModerators" className="dashboard-item">
            <FontAwesomeIcon icon={faUsersGear} className="icon" />
            <span>Moderators</span>
          </Link>
        </>
      )}
      <button className="logout-btn" onClick={async()=>{
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.log("LoggingOut Err:   " + err.message);
        }
      }}>Logout</button>
    </div>
  );
};

export default ManagingDashboard;
