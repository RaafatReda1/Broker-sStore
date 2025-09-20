import React, { useContext, useEffect, useState } from "react";
import "./PreviewData.css";
import { sessionContext, userDataContext } from "../../../AppContexts";
import supabase from "../../../SupabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserTie } from "@fortawesome/free-solid-svg-icons";

const PreviewData = () => {
  const { userData, setUserData } = useContext(userDataContext);
  const { session } = useContext(sessionContext);

  const [isEditing, setIsEditing] = useState(false);
  const [refresh, setRefresh] = useState(false);

  const [userDataForm, setUserDataForm] = useState({
    fullName: "",
    nickName: "",
    phone: "",
  });

  // sync form with fetched userData
  useEffect(() => {
    if (userData) {
      setUserDataForm({
        fullName: userData.fullName || "",
        nickName: userData.nickName || "",
        phone: userData.phone || "",
      });
    } else {
      setUserDataForm({
        fullName: "",
        nickName: "",
        phone: "",
      });
    }
  }, [userData]);

  // fetch data from DB
  const getUserData = async () => {
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
  };

  useEffect(() => {
    getUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  const handleChange = (e) => {
    setUserDataForm({
      ...userDataForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async () => {
    if (!userData) {
      alert("No user data found");
      return;
    }

    // فلترة القيم اللي المستخدم غيرها فقط
    const updatedFields = {};
    Object.keys(userDataForm).forEach((key) => {
      if (userDataForm[key] !== (userData[key] || "")) {
        updatedFields[key] = userDataForm[key];
      }
    });

    if (Object.keys(updatedFields).length === 0) {
      alert("No changes to update");
      setIsEditing(false);
      return;
    }

    const { data, error } = await supabase
      .from("Brokers")
      .update(updatedFields) // نبعث بس اللي اتغير
      .eq("id", userData.id)
      .select();

    if (error) {
      alert("Error Updating Data: " + error.message);
    } else if (data && data.length > 0) {
      alert("Data updated Successfully");
      setRefresh((prev) => !prev);
      setIsEditing(false);
    } else {
      alert("No data was updated");
    }
  };

  return (
    <>
      <div className="dataContainer">
        <h1>Profile</h1>

        <div className="profileContent">
          <div className="profileLeft">
            <div className={`avatarCard ${isEditing && "avatarCard2"}`}>
              <FontAwesomeIcon
                icon={faUserTie}
                style={{ width: "150px", height: "150px" }}
              />
            </div>
          </div>

          <div className="profileRight">
            <form className="profileForm">
              <label htmlFor="fullName">Full Name</label>
              <input
                value={userDataForm.fullName}
                name="fullName"
                onChange={handleChange}
                disabled={!isEditing}
                id="fullName"
              />

              <label htmlFor="nickName">Nickname</label>
              <input
                value={userDataForm.nickName}
                name="nickName"
                onChange={handleChange}
                disabled={!isEditing}
                id="nickName"
              />

              <label htmlFor="phone">Phone</label>
              <input
                value={userDataForm.phone}
                name="phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                onChange={handleChange}
                disabled={!isEditing}
                id="phone"
              />
            </form>
          </div>
        </div>
      </div>

      <div className="btns">
        <button
          className="savingBtn"
          onClick={() => {
            if (isEditing) {
              handleUpdate();
            } else {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? "Save Changes" : "Edit Data"}
        </button>

        {isEditing && (
          <button
            className="cancelBtn"
            onClick={() => {
              setIsEditing(false);
              setUserDataForm({
                fullName: userData?.fullName || "",
                nickName: userData?.nickName || "",
                phone: userData?.phone || "",
              }); // رجّع القيم القديمة
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </>
  );
};

export default PreviewData;
