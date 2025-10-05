import React from "react";
import { Routes, Route } from "react-router-dom";
import ManageBrokers from "../ManageBrokers/ManageBrokers";
import ManageModerators from "../ManageModerators/ManageModerators";
import ManageProducts from "../ManageProducts/ManageProducts";
import ManageOrders from "../ManageOrders/ManageOrders";
import "./Admin.css";
const Admin = () => {
  console.log("🔑 Admin Component Rendered - User has ADMIN access");

  return (
    <div className="admin">
      <Routes>
        <Route path="/manageBrokers" element={<ManageBrokers />} />
        <Route path="/manageModerators" element={<ManageModerators />} />
        <Route path="/manageProducts" element={<ManageProducts />} />
        <Route path="/manageOrders" element={<ManageOrders />} />
      </Routes>
    </div>
  );
};

export default Admin;
