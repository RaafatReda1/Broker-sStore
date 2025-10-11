import React, { useState, useContext, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./BrokersDataForm.css";
import supabase from "../../../SupabaseClient";
import { userContext, sessionContext } from "../../../AppContexts";
import { toast } from "react-toastify";
import FileValidationService from "../../../utils/fileValidationService";
import StorageOrganizationService from "../../../utils/storageOrganizationService";
import {
  User,
  Phone,
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  FileImage,
  UserCheck,
} from "lucide-react";
// id_card_back
// eslint-disable-next-line react/prop-types
const BrokersDataForm = ({ setRefresh }) => {
  const { t } = useTranslation();
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
      const file = files[0];
      if (file) {
        const validation = FileValidationService.validateFile(file);

        if (validation.success) {
          setBrokerData((prev) => ({ ...prev, [name]: file }));
          toast.success(
            `${file.name} ${t("profile.fileSelected")} (${
              validation.fileInfo.sizeFormatted
            })`
          );
        } else {
          toast.error(`${file.name}: ${validation.error}`);
          e.target.value = ""; // Clear the input
        }
      }
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
        toast.error(t("errors.userNotLoggedIn"));
        return;
      }

      if (
        !brokerData.idCardFront ||
        !brokerData.idCardBack ||
        !brokerData.selfieWithIdCard
      ) {
        toast.error(t("errors.uploadAllImages"));
        return;
      }

      setIsUploading(true);
      setUploadProgress({ front: 0, back: 0, selfie: 0 });

      try {
        // Upload broker ID card images with organized folder structure
        console.log(`📁 Uploading ID cards for broker: ${brokerData.fullName}`);

        const uploadResult = await StorageOrganizationService.uploadBrokerCards(
          brokerData,
          brokerData.fullName
        );

        if (!uploadResult.success) {
          throw new Error(
            `Failed to upload images: ${uploadResult.errors.join(", ")}`
          );
        }

        // Insert broker data into database with organized image URLs
        const { data, error } = await supabase.from("Brokers").insert({
          fullName: brokerData.fullName,
          nickName: brokerData.nickName,
          phone: brokerData.phone,
          email: user.email,
          auth_id: user.id,
          idCardFront: uploadResult.urls.idCardFront,
          idCardBack: uploadResult.urls.idCardBack,
          selfieWithIdCard: uploadResult.urls.selfieWithIdCard,
        });

        if (error) {
          throw error;
        }

        toast.success(t("success.brokerDataSubmitted"));
        console.log("✅ Broker data saved with organized storage:", {
          brokerName: brokerData.fullName,
          imageUrls: uploadResult.urls,
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
        toast.error(t("errors.brokerDataSubmission"));
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
      <div className="broker-header">
        <div className="broker-icon">
          <UserCheck size={32} />
        </div>
        <h1 className="broker-title">{t("profile.brokerRegistration")}</h1>
        <p className="broker-subtitle">{t("profile.completeProfile")}</p>
      </div>

      <form className="broker-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3 className="section-title">
            <User size={20} />
            {t("profile.personalInfo")}
          </h3>

          <div className="names">
            <div className="input-group">
              <label className="broker-label name-field">
                <div className="input-container">
                  <User className="input-icon" size={20} />
                  <input
                    className="broker-input"
                    type="text"
                    name="fullName"
                    value={brokerData.fullName}
                    onChange={handleChange}
                    required
                    placeholder=" "
                    disabled={isUploading}
                  />
                  <span className="floating-label">
                    {t("profile.fullName")}
                  </span>
                </div>
              </label>
            </div>

            <div className="input-group">
              <label className="broker-label name-field nickname-field">
                <div className="input-container">
                  <User className="input-icon" size={20} />
                  <input
                    className="broker-input"
                    type="text"
                    name="nickName"
                    value={brokerData.nickName}
                    onChange={handleChange}
                    required
                    placeholder=" "
                    disabled={isUploading}
                  />
                  <span className="floating-label">
                    {t("profile.nickname")}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="input-group">
            <label className="broker-label">
              <div className="input-container">
                <Phone className="input-icon" size={20} />
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
                  disabled={isUploading}
                />
                <span className="floating-label">
                  {t("profile.phoneNumber")}
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">
            <Camera size={20} />
            {t("profile.identityVerification")}
          </h3>
          <p className="section-description">
            {t("profile.uploadInstructions")}
          </p>
          <div className="file-validation-info">
            <span className="file-size-limit">
              {FileValidationService.getSizeLimitMessage()}
            </span>
            <span className="file-types-info">
              {FileValidationService.getSupportedTypesMessage()}
            </span>
          </div>

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
                    disabled={isUploading}
                  />
                  <div className="file-input-display">
                    {brokerData.idCardFront ? (
                      <div className="file-selected">
                        <FileImage className="file-icon" size={24} />
                        <div className="file-info">
                          <span className="file-name">
                            {brokerData.idCardFront.name}
                          </span>
                          <span className="file-size">
                            {getFileSize(brokerData.idCardFront)}
                          </span>
                        </div>
                        <CheckCircle className="check-icon" size={20} />
                      </div>
                    ) : (
                      <div className="file-placeholder">
                        <Camera className="upload-icon" size={32} />
                        <span className="upload-text">
                          {t("profile.idCardFront")}
                        </span>
                        <span className="upload-hint">
                          {t("profile.clickToUpload")}
                        </span>
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
                    disabled={isUploading}
                  />
                  <div className="file-input-display">
                    {brokerData.idCardBack ? (
                      <div className="file-selected">
                        <FileImage className="file-icon" size={24} />
                        <div className="file-info">
                          <span className="file-name">
                            {brokerData.idCardBack.name}
                          </span>
                          <span className="file-size">
                            {getFileSize(brokerData.idCardBack)}
                          </span>
                        </div>
                        <CheckCircle className="check-icon" size={20} />
                      </div>
                    ) : (
                      <div className="file-placeholder">
                        <Camera className="upload-icon" size={32} />
                        <span className="upload-text">
                          {t("profile.idCardBack")}
                        </span>
                        <span className="upload-hint">
                          {t("profile.clickToUpload")}
                        </span>
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
                    disabled={isUploading}
                  />
                  <div className="file-input-display">
                    {brokerData.selfieWithIdCard ? (
                      <div className="file-selected">
                        <FileImage className="file-icon" size={24} />
                        <div className="file-info">
                          <span className="file-name">
                            {brokerData.selfieWithIdCard.name}
                          </span>
                          <span className="file-size">
                            {getFileSize(brokerData.selfieWithIdCard)}
                          </span>
                        </div>
                        <CheckCircle className="check-icon" size={20} />
                      </div>
                    ) : (
                      <div className="file-placeholder">
                        <Camera className="upload-icon" size={32} />
                        <span className="upload-text">
                          {t("profile.selfieWithId")}
                        </span>
                        <span className="upload-hint">
                          {t("profile.clickToUpload")}
                        </span>
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
          className={`broker-submit-btn ${isUploading ? "loading" : ""}`}
          type="submit"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <div className="spinner"></div>
              {t("profile.uploadingSubmitting")}
            </>
          ) : (
            <>
              <Upload size={20} />
              {t("profile.submitBrokerData")}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default React.memo(BrokersDataForm);
