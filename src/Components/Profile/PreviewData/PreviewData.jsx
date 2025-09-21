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

  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

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
  //rendering the data according to the refresh state
  useEffect(() => {
    getUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);
  //setting the userFormData to the input values
  const handleChange = (e) => {
    setUserDataForm({
      ...userDataForm,
      [e.target.name]: e.target.value,
    });
  };
  //sending the new form to the DB
  const handleUpdate = async () => {
    if (!userData) {
      alert("No user data found");
      return;
    }

    // فلترة القيم اللي المستخدم غيرها فقط
    const updatedFields = {};
    Object.keys(userDataForm).forEach((key) => {
      if (userDataForm[key] !== userData[key] && userDataForm[key] !== "") {
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
  //handling the profile img temporary storage
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return; // لو مفيش فايل يخرج على طول
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file)); // يعمل preview
  };
  const handleUploadingAvatar = async () => {
    if (!selectedFile) return; // لو مفيش فايل محدد مفيش داعي نكمل

    try {
      // 1️⃣ حذف الصورة القديمة لو موجودة
      if (userData.avatar_url) {
        const oldFileName = userData.avatar_url.split("/").pop(); // الاسم بس
        const { data: deleteData, error: deleteError } = await supabase.storage
          .from("BrokersProfilePic")
          .remove([oldFileName]);

        if (deleteError) {
          console.error("Deleting Old Img Error:", deleteError.message);
        } else {
          console.log("Previous image deleted successfully:", deleteData);
        }
      }

      // 2️⃣ رفع الصورة الجديدة
      const newFileName = `${userData.id}_${Date.now()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("BrokersProfilePic")
        .upload(newFileName, selectedFile);

      if (uploadError) {
        alert("Uploading Img Error: " + uploadError.message);
        return;
      }

      // 3️⃣ الحصول على public URL للصورة الجديدة
      const { data: publicUrlData, error: publicUrlError } = supabase.storage
        .from("BrokersProfilePic")
        .getPublicUrl(newFileName);

      if (publicUrlError) {
        alert("Error getting public URL: " + publicUrlError.message);
        return;
      }

      const avatarUrl = publicUrlData.publicUrl;

      // 4️⃣ تحديث الـ avatar_url في جدول الـ DB
      const { data: updateData, error: updateError } = await supabase
        .from("Brokers")
        .update({ avatar_url: avatarUrl })
        .eq("id", userData.id)
        .select();

      if (updateError) {
        alert("Error updating avatar URL: " + updateError.message);
        return;
      }

      alert("Profile picture updated successfully!");
      setUserData((prev) => ({ ...prev, avatar_url: avatarUrl })); // تحديث الواجهة فورًا
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong!");
    }
  };

  return (
    <>
      <div className="dataContainer">
        <h1>Profile</h1>

        <div className="profileContent">
          <div className="profileLeft">
            <div
              className={`avatarCard ${isEditing && "avatarCard2"}`}
              onClick={() => {
                {
                  isEditing && document.getElementById("fileInput").click();
                }
              }}
            >
              {previewUrl && isEditing ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ width: "150px", height: "150px" }}
                />
              ) : userData?.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt="Profile"
                  style={{ width: "150px", height: "150px" }}
                />
              ) : (
                <FontAwesomeIcon
                  icon={faUserTie}
                  style={{ width: "150px", height: "150px" }}
                />
              )}

              <input
                type="file"
                accept="image/*"
                id="fileInput"
                style={{ display: "none" }}
                onChange={handleFile}
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
                onKeyDown={(e) => {
                  // لو المفتاح مش رقم ومش Backspace/Arrow → منع الكتابة
                  if (
                    !/[0-9]/.test(e.key) &&
                    e.key !== "Backspace" &&
                    e.key !== "ArrowLeft" &&
                    e.key !== "ArrowRight"
                  ) {
                    e.preventDefault();
                  }
                }}
                maxLength={11}
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
              handleUploadingAvatar();
              setRefresh((prev) => !prev);
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
