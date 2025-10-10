import React, { useContext, useEffect, useState } from "react";
import BrokersDataForm from "./BrokersDataForm/BrokersDataForm";
import PreviewData from "./PreviewData/PreviewData";
import supabase from "../../SupabaseClient";
import { sessionContext, userDataContext } from "../../AppContexts";
import { toast } from "react-toastify";
import { fetchBrokerData } from "../../utils/userDataService";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import "./Profile.css";

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
    <div className="profile-page-container">
      {checkDataIsLoading && (
        <div className="loading-state">
          <div className="loading-content">
            <Loader2 className="spinner" size={32} />
            <h3>Loading Profile...</h3>
            <p>Please wait while we fetch your data</p>
          </div>
        </div>
      )}

      {!checkDataIsLoading && !responded && (
        <div className="error-state">
          <div className="error-content">
            <AlertCircle className="error-icon" size={48} />
            <h3>Error Loading Profile</h3>
            <p>There was an issue fetching your profile data</p>
            <button
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              <RefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      )}

      {!checkDataIsLoading && responded && !brokerExists && !userData && (
        <BrokersDataForm setRefresh={setRefresh} />
      )}

      {!checkDataIsLoading && responded && brokerExists && userData && (
        <PreviewData />
      )}
    </div>
  );
};

export default Profile;
