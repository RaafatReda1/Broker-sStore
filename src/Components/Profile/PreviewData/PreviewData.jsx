import React, { useContext, useEffect } from "react";
import "./PreviewData.css";
import { sessionContext, userDataContext } from "../../../AppContexts";
import supabase from "../../../SupabaseClient";

const PreviewData = () => {
  const { userData, setUserData } = useContext(userDataContext);
  const { session } = useContext(sessionContext);
  //getting the user's data from the brokers table
  const getUserData = async () => {
    if (!session?.user?.email) return; // لو مفيش session متعملش حاجة

    const { data, error } = await supabase
      .from("Brokers")
      .select("*")
      .eq("email", session.user.email);

    if (error) {
      console.error("Fetching user data error:", error.message);
      return;
    }

    if (data && data.length > 0) {
      setUserData(data[0]); // خزن أول صف بدل ما تخزن array
      console.log("Fetched user data:", data[0]);
    } else {
      console.log("No user data found for this email");
    }
  };
  // خليها تشتغل بس لما session يتغير
  useEffect(() => {
    getUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="dataContainer">
        <h1>Profile</h1>

        <div className="profileContent">
          <div className="profileLeft">
            <div className="avatarCard">
              <img src="./vite.svg" alt="Profile avatar" />
            </div>
          </div>

          <div className="profileRight">
            <form className="profileForm">
              <label htmlFor="fullName">Full Name</label>
              <input defaultValue={userData?.fullName} disabled id="fullName" />

              <label htmlFor="nickName">Nickname</label>
              <input defaultValue={userData?.nickName} disabled id="nickName" />

              <label htmlFor="phone">Phone</label>
              <input defaultValue={userData?.phone} disabled id="phone" />
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default PreviewData;
