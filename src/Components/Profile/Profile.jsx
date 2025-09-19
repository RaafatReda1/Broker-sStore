import React, { useContext, useEffect, useState } from "react";
import BrokersDataForm from "./BrokersDataForm/BrokersDataForm";
import supabase from "../../SupabaseClient";
import { sessionContext } from "../../AppContexts";
import PreviewData from "./PreviewData/PreviewData";

const Profile = () => {
  const [brokerExists, setBrokerExists] = useState(null);
  const { session } = useContext(sessionContext);
  const [checkDataIsLoading, setCheckDataIsLoading] = useState(true);
  const [responded, setResponded] = useState(false);
  //Checking if the broker exists to preview the broker's form data submission or the profile data
  const checkIfBrokerExists = async () => {
    if (session) {
      try {
        const { data, error } = await supabase
          .from("Brokers")
          .select("*")
          .eq("email", session.user.email);
        if (error) {
          setBrokerExists(false);
          setResponded(false);
        } else if (data.length > 0) {
          setBrokerExists(true);
          setResponded(true);
        } else {
          setBrokerExists(false);
          setResponded(true);
        }
      } finally {
        setCheckDataIsLoading(false);
      }
    }
  };
  useEffect(() => {
    checkIfBrokerExists();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      {checkDataIsLoading && <p>Loading...</p>}
      {!checkDataIsLoading && !brokerExists && !responded && (
        <p>Error fetching Data</p>
      )}
      {!brokerExists && brokerExists !== null && responded && (
        <BrokersDataForm></BrokersDataForm>
      )}
      {brokerExists && (
        <PreviewData></PreviewData>
      )}
    </>
  );
};

export default Profile;
