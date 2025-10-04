import React, { useState } from "react";
import "./SignUp.css";
import supabase from "../../SupabaseClient";
import { useNotification } from "../../Contexts/NotificationContext";
const SignUp = () => {
  const [signUpForm, setSignUpForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { showSuccess, showError, showWarning } = useNotification();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignUpForm({ ...signUpForm, [name]: value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (signUpForm.password !== signUpForm.confirmPassword) {
      showWarning(
        "Password Mismatch",
        "Passwords do not match! Please try again."
      );
      return;
    }

    if (signUpForm.password.length < 6) {
      showWarning(
        "Weak Password",
        "Password must be at least 6 characters long."
      );
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: signUpForm.email,
        password: signUpForm.password,
      });

      if (error) {
        showError("Sign Up Failed", error.message);
      } else {
        showSuccess(
          "Account Created!",
          "Please check your email to confirm your account."
        );
      }
    } catch (error) {
      console.error("Error during sign up:", error);
      showError(
        "Sign Up Error",
        "An unexpected error occurred. Please try again."
      );
    }
  };

  return (
    <div className="signup-parent">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h1 className="signup-title">Sign Up</h1>

        <label className="signup-label">
          <input
            className="signup-input email-field"
            type="email"
            name="email"
            value={signUpForm.email}
            onChange={handleChange}
            required
            placeholder=" "
          />
          <span className="floating-label">Email</span>
        </label>

        <label className="signup-label password-field">
          <input
            className="signup-input"
            type={showPassword ? "text" : "password"}
            name="password"
            value={signUpForm.password}
            onChange={handleChange}
            required
            placeholder=" "
          />
          <span className="floating-label">Password</span>
          <div className="password-toggle-container">
            <input
              type="checkbox"
              id="password-toggle"
              className="password-checkbox"
              checked={showPassword}
              onChange={togglePasswordVisibility}
            />
            <label
              htmlFor="password-toggle"
              className="password-checkbox-label"
            >
              <span className="checkmark"></span>
            </label>
          </div>
        </label>

        <label className="signup-label password-field">
          <input
            className="signup-input"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={signUpForm.confirmPassword}
            onChange={handleChange}
            required
            placeholder=" "
          />
          <span className="floating-label">Confirm Password</span>
          <div className="password-toggle-container">
            <input
              type="checkbox"
              id="confirm-password-toggle"
              className="password-checkbox"
              checked={showConfirmPassword}
              onChange={toggleConfirmPasswordVisibility}
            />
            <label
              htmlFor="confirm-password-toggle"
              className="password-checkbox-label"
            >
              <span className="checkmark"></span>
            </label>
          </div>
        </label>

        <button className="signup-submit-btn" type="submit">
          Sign Up
        </button>
      </form>
    </div>
  );
};

export default SignUp;
