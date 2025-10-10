import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import ManagingDashboard from "../ManagingDashboard/ManagingDashboard";
import ManageBrokers from "../ManageBrokers/ManageBrokers";
import ManageOrders from "../ManageOrders/ManageOrders";
import "./Moderator.css";
import ManageNotifications from "../ManageNotifications/ManageNotifications";
import AboutUs from "../../AboutUs/AboutUs";
const Moderator = () => {
  console.log("👮 Moderator Component Rendered - User has MODERATOR access");
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/aboutus");
  }, []);

  return (
    <div className="moderator">
      <Routes>
        <Route path="/manageBrokers" element={<ManageBrokers />} />
        <Route path="/manageOrders" element={<ManageOrders />} />
        <Route path="/manageNotifications" element={<ManageNotifications />} />
        <Route path="/aboutus" element={<AboutUs />} />
      </Routes>
    </div>
  );
};

export default Moderator;
