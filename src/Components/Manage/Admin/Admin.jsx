import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import ManageBrokers from "../ManageBrokers/ManageBrokers";
import ManageModerators from "../ManageModerators/ManageModerators";
import ManageProducts from "../ManageProducts/ManageProducts";
import ManageOrders from "../ManageOrders/ManageOrders";
import "./Admin.css";
import ManageNotifications from "../ManageNotifications/ManageNotifications";
import ManageWithDrawal from "../ManageWithDrawal/ManageWithDrawal";
import AboutUs from "../../AboutUs/AboutUs";
const Admin = () => {
  console.log("🔑 Admin Component Rendered - User has ADMIN access");
 const navigate = useNavigate();

  useEffect(() => {
    navigate("/aboutus");
  }, []);

  return (
    <div className="admin">
      <Routes>
        <Route path="/manageBrokers" element={<ManageBrokers />} />
        <Route path="/manageModerators" element={<ManageModerators />} />
        <Route path="/manageProducts" element={<ManageProducts />} />
        <Route path="/manageOrders" element={<ManageOrders />} />
        <Route path="/manageNotifications" element={<ManageNotifications />} />
        <Route path ="/manageWithdrawals" element={<ManageWithDrawal />} />
        <Route path="/aboutus" element={<AboutUs />} />
      </Routes>
    </div>
  );
};

export default Admin;
