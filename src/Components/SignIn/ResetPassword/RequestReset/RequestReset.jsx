import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import supabase from "../../../../SupabaseClient";
import { toast } from "react-toastify";
import {
  Mail,
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import "./RequestReset.css";

const RequestReset = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    // Clear error when user starts typing
    if (emailError) {
      setEmailError("");
    }
  };

  const sendResetRequest = async (e) => {
    e.preventDefault();

    // Validation
    if (!email.trim()) {
      setEmailError(t("resetPassword.emailRequired"));
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(t("resetPassword.emailInvalid"));
      return;
    }

    setIsLoading(true);
    setEmailError("");

    try {
      const redirectUrl = window.location.origin + "/doreset";
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error("Reset password error:", error);
        setEmailError(
          error.message || "Failed to send reset email. Please try again."
        );
        toast.error("Failed to send reset email. Please try again.");
      } else if (data) {
        console.log("Reset password data:", data);
        setIsSuccess(true);
        toast.success("Password reset email sent! Check your inbox.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setEmailError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="request-reset-container">
      {!isSuccess ? (
        <>
          <div className="reset-header">
            <div className="reset-icon">
              <Mail size={32} />
            </div>
            <h1 className="reset-title">
              {t("resetPassword.resetYourPassword")}
            </h1>
            <p className="reset-subtitle">{t("resetPassword.resetSubtitle")}</p>
          </div>

          <form className="reset-form" onSubmit={sendResetRequest}>
            <div className="input-group">
              <label className="reset-label">
                <div className="input-container">
                  <Mail className="input-icon" size={20} />
                  <input
                    className={`reset-input ${emailError ? "error" : ""}`}
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder=" "
                    disabled={isLoading}
                  />
                  <span className="floating-label">
                    {t("resetPassword.emailAddress")}
                  </span>
                </div>
                {emailError && (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    {emailError}
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
                  {t("resetPassword.sendingResetLink")}
                </>
              ) : (
                <>
                  <Send size={20} />
                  {t("resetPassword.sendResetLink")}
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
          <h2 className="success-title">{t("resetPassword.checkYourEmail")}</h2>
          <p className="success-message">
            {t("resetPassword.emailSentTo", { email })}
          </p>
          <div className="success-instructions">
            <p>{t("resetPassword.checkEmailInstructions")}</p>
            <p>{t("resetPassword.checkSpamFolder")}</p>
          </div>
          <div className="success-actions">
            <button
              className="resend-btn"
              onClick={() => {
                setIsSuccess(false);
                setEmail("");
              }}
            >
              <Send size={16} />
              {t("resetPassword.sendAnotherEmail")}
            </button>
            <Link to="/signin" className="back-to-signin">
              <ArrowLeft size={16} />
              {t("resetPassword.backToSignIn")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestReset;
