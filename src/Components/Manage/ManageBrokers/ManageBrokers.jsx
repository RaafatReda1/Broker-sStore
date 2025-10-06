import React, { useEffect, useState } from "react";
import supabase from "../../../SupabaseClient";
import ViewImages from "./ViewImages/ViewImages";
import ViewStatistics from "./ViewStatistics/ViewStatistics";

const ManageBrokers = () => {
  const [brokers, setBrokers] = useState([]);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [showImages, setShowImages] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  // 🔹 Fetch brokers from DB
  const fetchBrokers = async () => {
    const { data, error } = await supabase.from("Brokers").select("*");
    if (error) {
      console.error("Error fetching brokers:", error);
    } else if (data) {
      setBrokers(data);
      console.log("Fetched brokers:", data);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Manage Brokers</h1>

      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", borderCollapse: "collapse" ,height:"100vh"}}
      >
        <thead style={{ backgroundColor: "#f2f2f2" }}>
          <tr>
            <th>ID</th>
            <th>Avatar</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Verification</th>
            <th>IdCard Images</th>
            <th>Statistics</th>
          </tr>
        </thead>
        <tbody>
          {brokers.map((broker) => (
            <React.Fragment key={broker.id}>
              <tr>
                <td>{broker.id}</td>
                <td>
                  {broker.avatar_url ? (
                    <img
                      src={broker.avatar_url}
                      alt="Avatar"
                      width="50"
                      height="50"
                      style={{ borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    "No image"
                  )}
                </td>
                <td>{broker.fullName}</td>
                <td>{broker.email}</td>
                <td>{broker.phone}</td>
                <td style={{ color: broker.isVerified ? "green" : "red" }}>
                  {broker.isVerified ? "Verified" : "Not Verified"}
                </td>
                <td>
                  <button
                    onClick={() => {
                      setSelectedBroker(broker);
                      setShowImages(true);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    View Images
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => {
                      setSelectedBroker(broker);
                      setShowStatistics(true);
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    View Statistics
                  </button>
                </td>
              </tr>

              {/* ✅ Only show the modal for the selected broker */}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      {showImages && (
        <ViewImages
          broker={selectedBroker}
          onClose={() => setSelectedBroker(null)}
          show={{ showImages, setShowImages }}
        />
      )}

      {showStatistics && (
        <ViewStatistics
          broker={selectedBroker}
          onClose={() => setSelectedBroker(null)}
          show={{ showStatistics, setShowStatistics }}
        />
      )}
    </div>
  );
};

export default ManageBrokers;
