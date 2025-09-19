import React, { useContext, useEffect, useState } from "react";
import BrokersDataForm from "../BrokersDataForm/BrokersDataForm";
import supabase from "../../SupabaseClient";
import { sessionContext } from "../../App";

const Profile = () => {
  const [brokerExists, setBrokerExists] = useState(null);
  const { session } = useContext(sessionContext);
  const checkIfBrokerExists = async () => {
    if (session) {
      try {
        const { data } = await supabase
          .from("Brokers")
          .select("*")
          .eq("email", session.user.email);
        if (data.length > 0) {
          setBrokerExists(true);
        } else {
          setBrokerExists(false);
        }
      } catch (err) {
        console.log(err);
      }
    }
  };
  useEffect(() => {
    checkIfBrokerExists();
    console.log(brokerExists);
    console.log(session.user.email)
  });
  return (
    <>
      <div>Profile</div>
      {!brokerExists && brokerExists !== null && <BrokersDataForm></BrokersDataForm>}
    </>
  );
};

export default Profile;
