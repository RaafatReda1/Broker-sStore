import React, { useState, useContext, useCallback, useMemo } from "react";
import "./BrokersDataForm.css";
import supabase from "../../../SupabaseClient";
import { userContext, sessionContext } from "../../../AppContexts";
import { toast } from "react-toastify";
// id_card_back
// eslint-disable-next-line react/prop-types
const BrokersDataForm = ({ setRefresh }) => {
  const { user } = useContext(userContext);
  const { session } = useContext(sessionContext);
  const [brokerData, setBrokerData] = useState({
    fullName: "",
    nickName: "",
    phone: "",
    email: "",
    idCardFront: null,
    idCardBack: null,
    selfieWithIdCard: null,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    front: 0,
    back: 0,
    selfie: 0,
  });

  const handleChange = useCallback((e) => {
    const { name, value, files } = e.target;
    if (files) {
      setBrokerData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setBrokerData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const uploadImageToStorage = async (file, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from("BrokersCards")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("BrokersCards").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const uploadWithProgress = useCallback(async (file, fileName, type) => {
    try {
      // Set initial progress
      setUploadProgress((prev) => ({ ...prev, [type]: 10 }));

      // Upload file
      const { data, error } = await supabase.storage
        .from("BrokersCards")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Set completion progress
      setUploadProgress((prev) => ({ ...prev, [type]: 100 }));

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("BrokersCards").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      throw error;
    }
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!session || !user.id) {
        toast.error("User not logged in.");
        return;
      }

      if (
        !brokerData.idCardFront ||
        !brokerData.idCardBack ||
        !brokerData.selfieWithIdCard
      ) {
        toast.error("Please upload all required images.");
        return;
      }

      setIsUploading(true);
      setUploadProgress({ front: 0, back: 0, selfie: 0 });

      try {
        // Generate unique file names
        const timestamp = Date.now();
        const frontFileName = `${user.id}/id_front_${timestamp}.jpg`;
        const backFileName = `${user.id}/id_back_${timestamp}.jpg`;
        const selfieFileName = `${user.id}/selfie_with_id_${timestamp}.jpg`;

        // Upload all images with progress tracking
        const [frontUrl, backUrl, selfieUrl] = await Promise.all([
          uploadWithProgress(brokerData.idCardFront, frontFileName, "front"),
          uploadWithProgress(brokerData.idCardBack, backFileName, "back"),
          uploadWithProgress(
            brokerData.selfieWithIdCard,
            selfieFileName,
            "selfie"
          ),
        ]);

        // Insert broker data into database
        const { data, error } = await supabase.from("Brokers").insert({
          fullName: brokerData.fullName,
          nickName: brokerData.nickName,
          phone: brokerData.phone,
          email: user.email,
          auth_id: user.id,
          idCardFront: frontUrl,
          idCardBack: backUrl,
          selfieWithIdCard: selfieUrl,
        });

        if (error) {
          throw error;
        }
        toast.success("Broker data submitted successfully!");
        console.log("Broker data saved:", {
          ...brokerData,
          frontUrl,
          backUrl,
          selfieUrl,
        });

        // Reset form
        setBrokerData({
          fullName: "",
          nickName: "",
          phone: "",
          email: "",
          idCardFront: null,
          idCardBack: null,
          selfieWithIdCard: null,
        });

        // Trigger refresh after successful submission
        if (setRefresh) {
          setTimeout(() => {
            setRefresh((prev) => !prev);
          }, 1000);
        }
      } catch (error) {
        console.error("Error submitting broker data:", error);
        toast.error("Error submitting broker data.");
      } finally {
        setIsUploading(false);
        setUploadProgress({ front: 0, back: 0, selfie: 0 });
      }
    },
    [brokerData, session, user, uploadWithProgress, setRefresh]
  );

  // Memoized file size calculation
  const getFileSize = useCallback((file) => {
    if (!file) return "0 MB";
    return `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }, []);

  // Memoized phone validation
  const handlePhoneKeyDown = useCallback((e) => {
    if (
      !/[0-9]/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight"
    ) {
      e.preventDefault();
    }
  }, []);

  return (
    <div className="broker-parent">
      <form className="broker-form" onSubmit={handleSubmit}>
        <h1 className="broker-title">Broker Information</h1>

        <div className="names">
          <label className="broker-label name-field">
            <input
              className="broker-input"
              type="text"
              name="fullName"
              value={brokerData.fullName}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <span className="floating-label">Full Name</span>
          </label>

          <label className="broker-label name-field nickname-field">
            <input
              className="broker-input"
              type="text"
              name="nickName"
              value={brokerData.nickName}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <span className="floating-label">Nickname</span>
          </label>
        </div>

        <label className="broker-label">
          <input
            className="broker-input"
            type="tel"
            name="phone"
            value={brokerData.phone}
            onChange={handleChange}
            required
            placeholder=" "
            inputMode="numeric"
            pattern="[0-9]*"
            onKeyDown={handlePhoneKeyDown}
            maxLength={11}
          />
          <span className="floating-label">Phone Number</span>
        </label>

        <div className="id-card-upload-section">
          <h3 className="upload-section-title">ID Card Photos</h3>

          <div className="id-card-uploads">
            <div className="id-card-upload-item">
              <label className="broker-label" htmlFor="idFront">
                <div className="file-input-container">
                  <input
                    className="broker-file"
                    type="file"
                    name="idCardFront"
                    id="idFront"
                    accept="image/*"
                    onChange={handleChange}
                    required
                  />
                  <div className="file-input-display">
                    {brokerData.idCardFront ? (
                      <div className="file-selected">
                        <span className="file-name">
                          {brokerData.idCardFront.name}
                        </span>
                        <span className="file-size">
                          {getFileSize(brokerData.idCardFront)}
                        </span>
                      </div>
                    ) : (
                      <div className="file-placeholder">
                        <span className="upload-icon">📷</span>
                        <span>ID Card Front Photo</span>
                      </div>
                    )}
                  </div>
                </div>
                {isUploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${uploadProgress.front}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {Math.round(uploadProgress.front)}%
                    </span>
                  </div>
                )}
              </label>
            </div>

            <div className="id-card-upload-item">
              <label className="broker-label" htmlFor="idBack">
                <div className="file-input-container">
                  <input
                    className="broker-file"
                    type="file"
                    name="idCardBack"
                    id="idBack"
                    accept="image/*"
                    onChange={handleChange}
                    required
                  />
                  <div className="file-input-display">
                    {brokerData.idCardBack ? (
                      <div className="file-selected">
                        <span className="file-name">
                          {brokerData.idCardBack.name}
                        </span>
                        <span className="file-size">
                          {getFileSize(brokerData.idCardBack)}
                        </span>
                      </div>
                    ) : (
                      <div className="file-placeholder">
                        <span className="upload-icon">📷</span>
                        <span>ID Card Back Photo</span>
                      </div>
                    )}
                  </div>
                </div>
                {isUploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${uploadProgress.back}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {Math.round(uploadProgress.back)}%
                    </span>
                  </div>
                )}
              </label>
            </div>

            <div className="id-card-upload-item">
              <label className="broker-label" htmlFor="selfieWithId">
                <div className="file-input-container">
                  <input
                    className="broker-file"
                    type="file"
                    name="selfieWithIdCard"
                    id="selfieWithId"
                    accept="image/*"
                    onChange={handleChange}
                    required
                  />
                  <div className="file-input-display">
                    {brokerData.selfieWithIdCard ? (
                      <div className="file-selected">
                        <span className="file-name">
                          {brokerData.selfieWithIdCard.name}
                        </span>
                        <span className="file-size">
                          {getFileSize(brokerData.selfieWithIdCard)}
                        </span>
                      </div>
                    ) : (
                      <div className="file-placeholder">
                        <span className="upload-icon">📷</span>
                        <span>Selfie with ID Card</span>
                      </div>
                    )}
                  </div>
                </div>
                {isUploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${uploadProgress.selfie}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {Math.round(uploadProgress.selfie)}%
                    </span>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        <button
          className="broker-submit-btn"
          type="submit"
          disabled={isUploading}
        >
          {isUploading ? "Uploading..." : "Submit Broker Data"}
        </button>
      </form>
    </div>
  );
};

export default React.memo(BrokersDataForm);
