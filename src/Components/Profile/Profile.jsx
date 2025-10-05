import React, { useContext, useEffect, useState } from "react";
import BrokersDataForm from "./BrokersDataForm/BrokersDataForm";
import PreviewData from "./PreviewData/PreviewData";
import supabase from "../../SupabaseClient";
import { sessionContext, userDataContext } from "../../AppContexts";
import { toast } from "react-toastify";
import { fetchBrokerData } from "../../utils/userDataService";

const Profile = () => {
  const [brokerExists, setBrokerExists] = useState(null);
  const [checkDataIsLoading, setCheckDataIsLoading] = useState(true);
  const [responded, setResponded] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const { session } = useContext(sessionContext);
  const { userData, setUserData } = useContext(userDataContext);

  // ✅ Unified function to fetch broker data
  const fetchBrokerDataHandler = async () => {
    if (!session?.user?.email) return;

    setCheckDataIsLoading(true);

    const userData = await fetchBrokerData(
      session.user.email,
      setUserData,
      null,
      true
    );

    if (userData) {
      setBrokerExists(true);
      setResponded(true);
      console.log("✅ Broker found:", userData);
    } else {
      setBrokerExists(false);
      setResponded(true);
      console.log("⚠️ No broker data found for:", session.user.email);
    }

    setCheckDataIsLoading(false);
  };

  // ✅ Run on mount, session change, or refresh trigger
  useEffect(() => {
    fetchBrokerDataHandler();
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
