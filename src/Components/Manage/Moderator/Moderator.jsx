import React from "react";
import { Routes, Route } from "react-router-dom";
import ManagingDashboard from "../ManagingDashboard/ManagingDashboard";
import ManageBrokers from "../ManageBrokers/ManageBrokers";
import ManageOrders from "../ManageOrders/ManageOrders";

const Moderator = () => {
  console.log("👮 Moderator Component Rendered - User has MODERATOR access");

  return (
    <>
      <Routes>
        <Route path="/manageBrokers" element={<ManageBrokers />} />
        <Route path="/manageOrders" element={<ManageOrders />} />
      </Routes>
    </>
  );
};

export default Moderator;
