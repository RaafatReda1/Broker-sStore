import React, { useContext, useEffect, useState } from "react";
import "./PreviewData.css";
import { sessionContext, userDataContext } from "../../../AppContexts";
import supabase from "../../../SupabaseClient";

const PreviewData = () => {
  const { userData, setUserData } = useContext(userDataContext);
  const { session } = useContext(sessionContext);
  const [isEditing, setIsEditing] = useState(false);

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
            <div className={`avatarCard ${isEditing && "avatarCard2"}`}>
              <img
                src="./vite.svg"
                alt="Profile avatar"
                className="avatarImage"
              />
            </div>
          </div>

          <div className="profileRight">
            <form className="profileForm">
              <label htmlFor="fullName">Full Name</label>
              <input
                defaultValue={userData?.fullName}
                {...(isEditing ? {} : { disabled: true })}
                id="fullName"
              />

              <label htmlFor="nickName">Nickname</label>
              <input
                defaultValue={userData?.nickName}
                {...(isEditing ? {} : { disabled: true })}
                id="nickName"
              />

              <label htmlFor="phone">Phone</label>
              <input
                defaultValue={userData?.phone}
                {...(isEditing ? {} : { disabled: true })}
                id="phone"
              />
            </form>
          </div>
        </div>
      </div>
      <div className="btns">
        <button className="savingBtn" onClick={() => setIsEditing(true)}>
          {isEditing ? "Save Changes" : "Edit Data"}
        </button>
        {isEditing && (
          <button className="cancelBtn" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        )}
      </div>
    </>
  );
};

export default PreviewData;
