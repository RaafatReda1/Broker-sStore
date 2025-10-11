import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import supabase from "../../../../SupabaseClient";
import { toast } from "react-toastify";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./DoReset.css";

const DoReset = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const navigate = useNavigate();

  // Password validation
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid:
        password.length >= minLength &&
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar,
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    };
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    // Clear error when user starts typing
    if (passwordError) {
      setPasswordError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    setConfirmPassword(value);

    // Clear error when user starts typing
    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!password.trim()) {
      setPasswordError("Password is required");
      return;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password");
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(
        "Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters"
      );
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setPasswordError("");
    setConfirmPasswordError("");

    try {
      const { data, error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error("Reset password error:", error);
        setPasswordError(
          error.message || "Failed to reset password. Please try again."
        );
        toast.error(t("resetPassword.failedToResetPassword"));
      } else if (data) {
        console.log("Reset password data:", data);
        setIsSuccess(true);
        toast.success(t("resetPassword.passwordResetSuccessfully"));

        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          navigate("/signin");
        }, 3000);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setPasswordError("An unexpected error occurred. Please try again.");
      toast.error(t("resetPassword.unexpectedError"));
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);

  return (
    <div className="doreset-container">
      {!isSuccess ? (
        <>
          <div className="reset-header">
            <div className="reset-icon">
              <Lock size={32} />
            </div>
            <h1 className="reset-title">{t("resetPassword.setNewPassword")}</h1>
            <p className="reset-subtitle">
              {t("resetPassword.setNewPasswordSubtitle")}
            </p>
          </div>

          <form className="reset-form" onSubmit={resetPassword}>
            <div className="input-group">
              <label className="reset-label">
                <div className="input-container">
                  <Lock className="input-icon" size={20} />
                  <input
                    className={`reset-input ${passwordError ? "error" : ""}`}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder=" "
                    disabled={isLoading}
                  />
                  <span className="floating-label">
                    {t("resetPassword.newPassword")}
                  </span>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {passwordError && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {passwordError}
                  </div>
                )}
                {password && !passwordError && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div
                        className="strength-fill"
                        style={{
                          width: `${
                            (Object.values(passwordValidation).filter(Boolean)
                              .length /
                              5) *
                            100
                          }%`,
                          backgroundColor: passwordValidation.isValid
                            ? "#22c55e"
                            : "#f59e0b",
                        }}
                      ></div>
                    </div>
                    <div className="strength-requirements">
                      <div
                        className={`requirement ${
                          passwordValidation.minLength ? "valid" : ""
                        }`}
                      >
                        <CheckCircle size={14} />
                        {t("resetPassword.atLeast8Characters")}
                      </div>
                      <div
                        className={`requirement ${
                          passwordValidation.hasUpperCase ? "valid" : ""
                        }`}
                      >
                        <CheckCircle size={14} />
                        {t("resetPassword.uppercaseLetter")}
                      </div>
                      <div
                        className={`requirement ${
                          passwordValidation.hasLowerCase ? "valid" : ""
                        }`}
                      >
                        <CheckCircle size={14} />
                        {t("resetPassword.lowercaseLetter")}
                      </div>
                      <div
                        className={`requirement ${
                          passwordValidation.hasNumbers ? "valid" : ""
                        }`}
                      >
                        <CheckCircle size={14} />
                        {t("resetPassword.number")}
                      </div>
                      <div
                        className={`requirement ${
                          passwordValidation.hasSpecialChar ? "valid" : ""
                        }`}
                      >
                        <CheckCircle size={14} />
                        {t("resetPassword.specialCharacter")}
                      </div>
                    </div>
                  </div>
                )}
              </label>
            </div>

            <div className="input-group">
              <label className="reset-label">
                <div className="input-container">
                  <Lock className="input-icon" size={20} />
                  <input
                    className={`reset-input ${
                      confirmPasswordError ? "error" : ""
                    }`}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    placeholder=" "
                    disabled={isLoading}
                  />
                  <span className="floating-label">
                    {t("resetPassword.confirmPassword")}
                  </span>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {confirmPasswordError}
                  </div>
                )}
                {confirmPassword &&
                  !confirmPasswordError &&
                  password === confirmPassword && (
                    <div className="password-match">
                      <CheckCircle size={16} />
                      {t("resetPassword.passwordsMatch")}
                    </div>
                  )}
              </label>
            </div>

            <button
              className={`reset-submit-btn ${isLoading ? "loading" : ""}`}
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="spinner" size={20} />
                  {t("resetPassword.resettingPassword")}
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {t("resetPassword.resetPassword")}
                </>
              )}
            </button>
          </form>

          <div className="reset-footer">
            <Link to="/signin" className="back-to-signin">
              <ArrowLeft size={16} />
              {t("resetPassword.backToSignIn")}
            </Link>
          </div>
        </>
      ) : (
        <div className="success-state">
          <div className="success-icon">
            <CheckCircle size={48} />
          </div>
          <h2 className="success-title">
            {t("resetPassword.passwordResetSuccessfully")}
          </h2>
          <p className="success-message">
            {t("resetPassword.passwordUpdatedSuccessfully")}
          </p>
          <div className="success-instructions">
            <p>{t("resetPassword.redirectedAutomatically")}</p>
            <p>{t("resetPassword.clickButtonIfNotRedirected")}</p>
          </div>
          <div className="success-actions">
            <button
              className="go-to-signin-btn"
              onClick={() => navigate("/signin")}
            >
              <ArrowLeft size={16} />
              {t("resetPassword.goToSignIn")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoReset;
