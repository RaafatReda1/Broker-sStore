/* eslint-disable react/prop-types */
import React, { useState } from "react";
import "./CredentialVerificationModal.css";
import supabase from "../../../SupabaseClient";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

const CredentialVerificationModal = ({
  isOpen,
  onClose,
  onVerified,
  brokerEmail,
  title = "Verify Your Identity",
  message = "Please confirm your credentials to proceed with this withdrawal request.",
}) => {
  const [email, setEmail] = useState(brokerEmail || "");
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("❌ Please enter both email and password");
      return;
    }

    setIsVerifying(true);

    try {
      // Attempt to sign in with the provided credentials
      // This will not create a new session, just verify credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        // If there's an error, credentials are incorrect
        toast.error(
          "❌ Invalid credentials. Please check your email and password."
        );
        setPassword(""); // Clear password on error
        return;
      }

      // Verify that the user is a broker and matches the expected email
      if (data.user && data.user.email === brokerEmail) {
        toast.success("✅ Identity verified successfully!");

        // Clear sensitive data
        setPassword("");

        // Call the success callback
        if (onVerified) {
          onVerified();
        }
      } else {
        toast.error(
          "❌ Email mismatch. Please use your registered broker email."
        );
        setPassword("");
      }
    } catch (error) {
      // Error verifying credentials handled silently
      toast.error("❌ Verification failed. Please try again.");
      setPassword("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    setPassword("");
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="credential-modal-overlay" onClick={handleClose}>
      <div
        className="credential-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="credential-modal-close" onClick={handleClose}>
          X
        </button>

        <div className="credential-modal-header">
          <div className="credential-icon">🔐</div>
          <h2>{title}</h2>
          <p>{message}</p>
        </div>

        <form
          className="credential-form"
          onSubmit={handleVerify}
          autoComplete="off"
        >
          <div className="credential-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email-verification"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isVerifying}
              required
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-lpignore="true"
              data-form-type="other"
            />
          </div>

          <div className="credential-field">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                name="password-verification"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isVerifying}
                required
                autoComplete="new-password"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-lpignore="true"
                data-form-type="other"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isVerifying}
                tabIndex="-1"
              >
                {showPassword ? (
                  <FontAwesomeIcon icon={faEyeSlash} />
                ) : (
                  <FontAwesomeIcon icon={faEye} />
                )}
              </button>
            </div>
          </div>

          <div className="credential-actions">
            <button
              type="button"
              className="credential-btn cancel-btn"
              onClick={handleClose}
              disabled={isVerifying}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="credential-btn verify-btn"
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying..." : "Verify & Continue"}
            </button>
          </div>
        </form>

        <div className="credential-footer">
          <p>🔒 Your credentials are verified securely.</p>
        </div>
      </div>
    </div>
  );
};

export default CredentialVerificationModal;
