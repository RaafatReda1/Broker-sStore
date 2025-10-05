import React, { useContext, useEffect, useState } from "react";
import BrokersDataForm from "./BrokersDataForm/BrokersDataForm";
import PreviewData from "./PreviewData/PreviewData";
import supabase from "../../SupabaseClient";
import { sessionContext, userDataContext } from "../../AppContexts";
import { toast } from "react-toastify";

const Profile = () => {
  const [brokerExists, setBrokerExists] = useState(null);
  const [checkDataIsLoading, setCheckDataIsLoading] = useState(true);
  const [responded, setResponded] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const { session } = useContext(sessionContext);
  const { userData, setUserData } = useContext(userDataContext);

  // ✅ Unified function to fetch broker data
  const fetchBrokerData = async () => {
    if (!session?.user?.email) return;

    setCheckDataIsLoading(true);

    const { data, error } = await supabase
      .from("Brokers")
      .select("*")
      .eq("email", session.user.email);

    if (error) {
      console.error("Error fetching broker data:", error.message);
      toast.error("Failed to load profile data. Please try again.");
      setBrokerExists(false);
      setResponded(false);
      setUserData(null);
    } else if (data && data.length > 0) {
      setBrokerExists(true);
      setUserData(data[0]);
      setResponded(true);
      console.log("✅ Broker found:", data[0]);
    } else {
      setBrokerExists(false);
      setUserData(null);
      setResponded(true);
      console.log("⚠️ No broker data found for:", session.user.email);
    }

    setCheckDataIsLoading(false);
  };

  // ✅ Run on mount, session change, or refresh trigger
  useEffect(() => {
    fetchBrokerData();
  }, [session, refresh]);

  return (
    <>
      {checkDataIsLoading && <p>Loading...</p>}

      {!checkDataIsLoading && !responded && (
        <div>
          <p>Error fetching data</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {!checkDataIsLoading && responded && !brokerExists && !userData && (
        <BrokersDataForm setRefresh={setRefresh} />
      )}

      {!checkDataIsLoading && responded && brokerExists && userData && (
        <PreviewData />
      )}
    </>
  );
};

export default Profile;
