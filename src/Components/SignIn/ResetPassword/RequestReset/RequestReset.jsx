import React, { useState } from "react";
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
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
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
            <h1 className="reset-title">Reset Your Password</h1>
            <p className="reset-subtitle">
              Enter your email address and we&apos;ll send you a link to reset
              your password
            </p>
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
                  <span className="floating-label">Email Address</span>
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
                  Sending Reset Link...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          <div className="reset-footer">
            <Link to="/signin" className="back-to-signin">
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </div>
        </>
      ) : (
        <div className="success-state">
          <div className="success-icon">
            <CheckCircle size={48} />
          </div>
          <h2 className="success-title">Check Your Email</h2>
          <p className="success-message">
            We&apos;ve sent a password reset link to <strong>{email}</strong>
          </p>
          <div className="success-instructions">
            <p>
              Please check your email and follow the instructions to reset your
              password.
            </p>
            <p>If you don&apos;t see the email, check your spam folder.</p>
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
              Send Another Email
            </button>
            <Link to="/signin" className="back-to-signin">
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestReset;
