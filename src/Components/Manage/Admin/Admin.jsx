import React from "react";
import { Routes, Route } from "react-router-dom";
import ManagingDashboard from "../ManagingDashboard/ManagingDashboard";
import ManageBrokers from "../ManageBrokers/ManageBrokers";
import ManageModerators from "../ManageModerators/ManageModerators";
import ManageProducts from "../ManageProducts/ManageProducts";
import ManageOrders from "../ManageOrders/ManageOrders";

const Admin = () => {
  console.log("🔑 Admin Component Rendered - User has ADMIN access");

  return (
    <>
      <div
        style={{
          background: "#4CAF50",
          color: "white",
          padding: "8px",
          textAlign: "center",
          fontWeight: "bold",
        }}
      >
        🔑 ADMIN DASHBOARD - Full Access
      </div>
      <Routes>
        <Route path="/manageBrokers" element={<ManageBrokers />} />
        <Route path="/manageModerators" element={<ManageModerators />} />
        <Route path="/manageProducts" element={<ManageProducts />} />
        <Route path="/manageOrders" element={<ManageOrders />} />
      </Routes>
    </>
  );
};

export default Admin;
