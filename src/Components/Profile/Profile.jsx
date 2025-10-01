import React, { useContext, useEffect, useState } from "react";
import BrokersDataForm from "./BrokersDataForm/BrokersDataForm";
import supabase from "../../SupabaseClient";
import { sessionContext, userDataContext } from "../../AppContexts";
import PreviewData from "./PreviewData/PreviewData";

const Profile = () => {
  const [brokerExists, setBrokerExists] = useState(null);
  const { session } = useContext(sessionContext);
  const [checkDataIsLoading, setCheckDataIsLoading] = useState(true);
  const [responded, setResponded] = useState(false);
  const {userData, setUserData} = useContext(userDataContext);
  const [refresh, setRefresh] = useState(false);
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
  }, [refresh]);
  //getting the userdata to preview just after uploading the form
    const getUserData = (async () => {
      if (!session?.user?.email) return;
  
      const { data, error } = await supabase
        .from("Brokers")
        .select("*")
        .eq("email", session.user.email);
  
      if (error) {
        console.error("Fetching user data error:", error.message);
        return;
      }
  
      if (data && data.length > 0) {
        setUserData(data[0]);
        console.log("Fetched user data:", data[0]);
      } else {
        setUserData(null);
        console.log("No user data found for this email");
      }
    })
    useEffect(()=>{
       if (session) {
      getUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[refresh])
  return (
    <>
      {checkDataIsLoading && <p>Loading...</p>}
      {!checkDataIsLoading && !brokerExists && !responded && (
        <p>Error fetching Data</p>
      )}
      {!brokerExists && brokerExists !== null && responded && !userData&&(
        <BrokersDataForm setRefresh = {setRefresh}></BrokersDataForm>
      )}
      {brokerExists && userData &&(
        <PreviewData></PreviewData>
      )}
    </>
  );
};

export default Profile;
