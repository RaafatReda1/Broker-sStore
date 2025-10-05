import React, { useContext } from "react";
import { staffContext } from "../../../AppContexts";
import { Link, Routes } from "react-router-dom";

const ManagingDashboard = () => {
  const { isAdmin } = useContext(staffContext);
  const { isModerator } = useContext(staffContext);
  return (
    <>
      <div className="managing-dashboard">
        <h2>Managing Dashboard</h2>

        <Link to="/manageOrders">
          <button>Orders</button>
        </Link>
        <Link to="/manageBrokers">
          <button>Brokers</button>
        </Link>
        {isAdmin && (
          <>
            {" "}
            <Link to="/manageProducts">
              <button>Products</button>
            </Link>
            <Link to="/manageModerators">
              <button>Moderators</button>
            </Link>
          </>
        )}
      </div>
    </>
  );
};

export default ManagingDashboard;
