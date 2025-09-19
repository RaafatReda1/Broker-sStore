import React, { useState, useContext } from "react";
import "./BrokersDataForm.css";
import supabase from "../../SupabaseClient";
import { userContext, sessionContext } from "../../App";

const BrokersDataForm = () => {
  const { user } = useContext(userContext);
  const { session } = useContext(sessionContext);

  const [brokerData, setBrokerData] = useState({
    fullName: "",
    nickName: "",
    phone: "",
    email: "",
    idCardFront: null,
    idCardBack: null,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ front: 0, back: 0 });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setBrokerData({ ...brokerData, [name]: files[0] });
    } else {
      setBrokerData({ ...brokerData, [name]: value });
    }
  };

  const uploadImageToStorage = async (file, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from("Brokers'Cards")
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
      } = supabase.storage.from("Brokers'Cards").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const uploadWithProgress = async (file, fileName, type) => {
    return new Promise((resolve, reject) => {
      const uploadTask = supabase.storage
        .from("Brokers'Cards")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      // Simulate progress (Supabase doesn't provide real progress tracking)
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) progress = 90;
        setUploadProgress((prev) => ({ ...prev, [type]: progress }));
      }, 200);

      uploadTask
        .then(({ data, error }) => {
          clearInterval(progressInterval);
          setUploadProgress((prev) => ({ ...prev, [type]: 100 }));

          if (error) {
            reject(error);
            return;
          }

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("Brokers'Cards").getPublicUrl(fileName);

          resolve(publicUrl);
        })
        .catch(reject);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!session || !user.id) {
      alert("Please sign in to submit broker data.");
      return;
    }

    if (!brokerData.idCardFront || !brokerData.idCardBack) {
      alert("Please upload both ID card photos.");
      return;
    }

    setIsUploading(true);
    setUploadProgress({ front: 0, back: 0 });

    try {
      // Generate unique file names
      const timestamp = Date.now();
      const frontFileName = `${user.id}/id_front_${timestamp}.jpg`;
      const backFileName = `${user.id}/id_back_${timestamp}.jpg`;

      // Upload both images with progress tracking
      const [frontUrl, backUrl] = await Promise.all([
        uploadWithProgress(brokerData.idCardFront, frontFileName, "front"),
        uploadWithProgress(brokerData.idCardBack, backFileName, "back"),
      ]);

      // Insert broker data into database
      const { data, error } = await supabase.from("Brokers").insert({
        fullName: brokerData.fullName,
        nickName: brokerData.nickName,
        phone: brokerData.phone,
        email: brokerData.email,
        auth_id: user.id,
        id_card_front_url: frontUrl,
        id_card_back_url: backUrl,
      });

      if (error) {
        throw error;
      }

      alert("Broker data submitted successfully!");
      console.log("Broker data saved:", { ...brokerData, frontUrl, backUrl });

      // Reset form
      setBrokerData({
        fullName: "",
        nickName: "",
        phone: "",
        email: "",
        idCardFront: null,
        idCardBack: null,
      });
    } catch (error) {
      console.error("Error submitting broker data:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress({ front: 0, back: 0 });
    }
  };

  return (
    <div className="broker-parent">
      <form className="broker-form" onSubmit={handleSubmit}>
        <h1 className="broker-title">Broker Information</h1>

        <div className="broker-names">
          <label className="broker-label broker-name-field">
            <input
              className="broker-input"
              type="text"
              name="fullName"
              value={brokerData.fullName}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <span className="broker-floating-label">Full Name</span>
          </label>

          <label className="broker-label broker-name-field broker-nickname-field">
            <input
              className="broker-input"
              type="text"
              name="nickName"
              value={brokerData.nickName}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <span className="broker-floating-label">Nickname</span>
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
            pattern="[0-9]{10,15}"
          />
          <span className="broker-floating-label">Phone Number</span>
        </label>

        <label className="broker-label">
          <input
            className="broker-input"
            type="email"
            name="email"
            value={brokerData.email}
            onChange={handleChange}
            required
            placeholder=" "
          />
          <span className="broker-floating-label">Email</span>
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
                          {(brokerData.idCardFront.size / 1024 / 1024).toFixed(
                            2
                          )}{" "}
                          MB
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
                          {(brokerData.idCardBack.size / 1024 / 1024).toFixed(
                            2
                          )}{" "}
                          MB
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

export default BrokersDataForm;
