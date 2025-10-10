import React, { useEffect, useState } from "react";
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
        toast.error("Failed to reset password. Please try again.");
      } else if (data) {
        console.log("Reset password data:", data);
        setIsSuccess(true);
        toast.success("Password reset successfully!");

        // Redirect to sign in after 3 seconds
        setTimeout(() => {
          navigate("/signin");
        }, 3000);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setPasswordError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
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
            <h1 className="reset-title">Set New Password</h1>
            <p className="reset-subtitle">
              Enter your new password below. Make sure it&apos;s strong and
              secure.
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
                  <span className="floating-label">New Password</span>
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
                        At least 8 characters
                      </div>
                      <div
                        className={`requirement ${
                          passwordValidation.hasUpperCase ? "valid" : ""
                        }`}
                      >
                        <CheckCircle size={14} />
                        Uppercase letter
                      </div>
                      <div
                        className={`requirement ${
                          passwordValidation.hasLowerCase ? "valid" : ""
                        }`}
                      >
                        <CheckCircle size={14} />
                        Lowercase letter
                      </div>
                      <div
                        className={`requirement ${
                          passwordValidation.hasNumbers ? "valid" : ""
                        }`}
                      >
                        <CheckCircle size={14} />
                        Number
                      </div>
                      <div
                        className={`requirement ${
                          passwordValidation.hasSpecialChar ? "valid" : ""
                        }`}
                      >
                        <CheckCircle size={14} />
                        Special character
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
                  <span className="floating-label">Confirm Password</span>
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
                      Passwords match
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
                  Resetting Password...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Reset Password
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
          <h2 className="success-title">Password Reset Successfully!</h2>
          <p className="success-message">
            Your password has been updated successfully. You can now sign in
            with your new password.
          </p>
          <div className="success-instructions">
            <p>You will be redirected to the sign-in page automatically.</p>
            <p>If you&apos;re not redirected, click the button below.</p>
          </div>
          <div className="success-actions">
            <button
              className="go-to-signin-btn"
              onClick={() => navigate("/signin")}
            >
              <ArrowLeft size={16} />
              Go to Sign In
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoReset;
