import React, { useContext, useEffect, useState } from "react";
import "./PreviewData.css";
import { sessionContext, userDataContext } from "../../../AppContexts";
import supabase from "../../../SupabaseClient";
import { fetchBrokerData } from "../../../utils/userDataService";
import FileValidationService from "../../../utils/fileValidationService";
import {
  User,
  Phone,
  Edit3,
  Save,
  X,
  Camera,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Mail,
} from "lucide-react";
import { toast } from "react-toastify";

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
    await fetchBrokerData(session?.user?.email, setUserData, null, false);
  };
  //rendering the data according to the refresh state
  useEffect(() => {
    getUserData();
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
      toast.error("No user data found.");
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
      setIsEditing(false);
      return;
    }

    const { data, error } = await supabase
      .from("Brokers")
      .update(updatedFields) // نبعث بس اللي اتغير
      .eq("id", userData.id)
      .select();

    if (error) {
      toast.error(error.message);
    } else if (data && data.length > 0) {
      toast.success("Data updated successfully!");
      setRefresh((prev) => !prev);
      setIsEditing(false);
    } else {
      toast.error("Failed to update data.");
    }
  };
  //handling the profile img temporary storage with validation
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = FileValidationService.validateFile(file);

    if (validation.success) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      toast.success(
        `${file.name} selected (${validation.fileInfo.sizeFormatted})`
      );
    } else {
      toast.error(`${file.name}: ${validation.error}`);
      e.target.value = ""; // Clear the input
    }
  };
  //handle updating the profile pic with removing the older one in the DB
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
        toast.error("Error uploading image: " + uploadError.message);
        return;
      }

      // 3️⃣ الحصول على public URL للصورة الجديدة
      const { data: publicUrlData, error: publicUrlError } = supabase.storage
        .from("BrokersProfilePic")
        .getPublicUrl(newFileName);

      if (publicUrlError) {
        toast.error("Error getting public URL: " + publicUrlError.message);
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
        toast.error("Error updating avatar URL: " + updateError.message);
        return;
      }
      toast.success("Avatar updated successfully!");
      setUserData((prev) => ({ ...prev, avatar_url: avatarUrl })); // تحديث الواجهة فورًا
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred while updating avatar.", {
        autoClose: 5000,
      });
    }
  };

  return (
    <div className="preview-data-container">
      <div className="profile-header">
        <div className="profile-header-icon">
          <UserCheck size={32} />
        </div>
        <div className="profile-title-section">
          <h1 className="profile-title">
            Profile
            {userData?.isVerified && (
              <span className="verified-badge">
                <CheckCircle size={20} />
              </span>
            )}
          </h1>
          <p className="profile-subtitle">
            Manage your broker profile information
          </p>
        </div>
      </div>

      {userData && !userData.isVerified && (
        <div className="verification-warning">
          <AlertTriangle className="warning-icon" size={20} />
          <div className="warning-content">
            <h4>Account Under Review</h4>
            <p>
              Your account is under review. You cannot work until verification
              is complete.
            </p>
          </div>
        </div>
      )}

      <div className="profile-content">
        <div className="profile-left">
          <div
            className={`avatar-card ${isEditing ? "editing" : ""}`}
            onClick={() => {
              if (isEditing) {
                document.getElementById("fileInput").click();
              }
            }}
          >
            {previewUrl && isEditing ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="avatar-image"
                onError={(e) => {
                  console.error("❌ Failed to load preview image");
                  e.target.style.display = "none";
                }}
              />
            ) : userData?.avatar_url ? (
              <img
                src={userData.avatar_url}
                alt="Profile"
                className="avatar-image"
                onError={(e) => {
                  console.error(
                    "❌ Failed to load profile image:",
                    userData.avatar_url
                  );
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div className="avatar-placeholder">
                <User size={48} />
              </div>
            )}

            {isEditing && (
              <div className="avatar-overlay">
                <Camera size={24} />
                <span>Change Photo</span>
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              id="fileInput"
              style={{ display: "none" }}
              onChange={handleFile}
            />
          </div>

          {isEditing && (
            <div className="file-validation-info">
              <span className="file-size-limit">
                {FileValidationService.getSizeLimitMessage()}
              </span>
              <span className="file-types-info">
                {FileValidationService.getSupportedTypesMessage()}
              </span>
            </div>
          )}
        </div>

        <div className="profile-right">
          <div className="profile-form-section">
            <h3 className="form-section-title">
              <User size={20} />
              Personal Information
            </h3>

            <form className="profile-form">
              <div className="input-group">
                <label className="profile-label" htmlFor="fullName">
                  <div className="input-container">
                    <User className="input-icon" size={20} />
                    <input
                      className="profile-input"
                      value={userDataForm.fullName}
                      name="fullName"
                      onChange={handleChange}
                      disabled={!isEditing}
                      id="fullName"
                      placeholder=" "
                    />
                    <span className="floating-label">Full Name</span>
                  </div>
                </label>
              </div>

              <div className="input-group">
                <label className="profile-label" htmlFor="nickName">
                  <div className="input-container">
                    <User className="input-icon" size={20} />
                    <input
                      className="profile-input"
                      value={userDataForm.nickName}
                      name="nickName"
                      onChange={handleChange}
                      disabled={!isEditing}
                      id="nickName"
                      placeholder=" "
                    />
                    <span className="floating-label">Nickname</span>
                  </div>
                </label>
              </div>

              <div className="input-group">
                <label className="profile-label" htmlFor="phone">
                  <div className="input-container">
                    <Phone className="input-icon" size={20} />
                    <input
                      className="profile-input"
                      value={userDataForm.phone}
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      onChange={handleChange}
                      onKeyDown={(e) => {
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
                      placeholder=" "
                    />
                    <span className="floating-label">Phone Number</span>
                  </div>
                </label>
              </div>

              <div className="input-group">
                <label className="profile-label" htmlFor="email">
                  <div className="input-container">
                    <Mail className="input-icon" size={20} />
                    <input
                      className="profile-input"
                      value={userData?.email || session?.user?.email || ""}
                      disabled={true}
                      id="email"
                      placeholder=" "
                    />
                    <span className="floating-label">Email Address</span>
                  </div>
                </label>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="profile-actions">
        <button
          className={`profile-action-btn primary ${
            isEditing ? "save" : "edit"
          }`}
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
          {isEditing ? (
            <>
              <Save size={20} />
              Save Changes
            </>
          ) : (
            <>
              <Edit3 size={20} />
              Edit Profile
            </>
          )}
        </button>

        {isEditing && (
          <button
            className="profile-action-btn secondary"
            onClick={() => {
              setIsEditing(false);
              setUserDataForm({
                fullName: userData?.fullName || "",
                nickName: userData?.nickName || "",
                phone: userData?.phone || "",
              });
              setPreviewUrl(null);
              setSelectedFile(null);
            }}
          >
            <X size={20} />
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default PreviewData;
