import React from "react";
import { Routes, Route } from "react-router-dom";
import ManagingDashboard from "../ManagingDashboard/ManagingDashboard";
import ManageBrokers from "../ManageBrokers/ManageBrokers";
import ManageOrders from "../ManageOrders/ManageOrders";
import "./Moderator.css";
const Moderator = () => {
  console.log("👮 Moderator Component Rendered - User has MODERATOR access");

  return (
    <div className="moderator">
      <Routes>
        <Route path="/manageBrokers" element={<ManageBrokers />} />
        <Route path="/manageOrders" element={<ManageOrders />} />
      </Routes>
    </div>
  );
};

export default Moderator;
