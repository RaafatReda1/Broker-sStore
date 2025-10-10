import React, { useEffect, useState } from "react";
import supabase from "../../../../SupabaseClient";

const DoReset = () => {
  const [password, setPassword] = useState("");
  const resetPassword = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      console.log(error);
    } else if (data) {
      console.log(data);
    }
  };

  return <div className="doreset-container">
    <input
      type="password"
      placeholder="New Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
    />
    <button onClick={resetPassword}>Reset Password</button>
  </div>;
};

export default DoReset;
