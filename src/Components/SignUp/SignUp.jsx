import React, { useState } from "react";
import "./SignUp.css";
import supabase from "../../SupabaseClient";
import { toast } from "react-toastify";
import { Mail, Lock, Eye, EyeOff, UserPlus, CheckCircle } from "lucide-react";
const SignUp = () => {
  const [signUpForm, setSignUpForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignUpForm({ ...signUpForm, [name]: value });

    // Calculate password strength
    if (name === "password") {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (signUpForm.password !== signUpForm.confirmPassword) {
      toast.error("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      toast.error("Password is too weak. Please use a stronger password.");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpForm.email,
        password: signUpForm.password,
      });

      if (error) {
        console.error("Error during sign up:", error);
        toast.error("Sign up failed. Please try again.");
      } else if (data) {
        toast.success(
          "Sign up successful! Check your email for verification.",
          {
            autoClose: 5000,
          }
        );
        // Reset form
        setSignUpForm({
          email: "",
          password: "",
          confirmPassword: "",
        });
        setPasswordStrength(0);
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthText = () => {
    const strengthTexts = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
    return strengthTexts[passwordStrength] || "Very Weak";
  };

  const getPasswordStrengthColor = () => {
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
    return colors[passwordStrength] || "#ef4444";
  };

  return (
    <div className="signup-parent">
      <div className="signup-header">
        <div className="signup-icon">
          <UserPlus size={32} />
        </div>
        <h1 className="signup-title">Create Account</h1>
        <p className="signup-subtitle">Join us and start your journey</p>
      </div>

      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="signup-label">
            <div className="input-container">
              <Mail className="input-icon" size={20} />
              <input
                className="signup-input"
                type="email"
                name="email"
                value={signUpForm.email}
                onChange={handleChange}
                required
                placeholder=" "
                disabled={isLoading}
              />
              <span className="floating-label">Email Address</span>
            </div>
          </label>
        </div>

        <div className="input-group">
          <label className="signup-label password-field">
            <div className="input-container">
              <Lock className="input-icon" size={20} />
              <input
                className="signup-input"
                type={showPassword ? "text" : "password"}
                name="password"
                value={signUpForm.password}
                onChange={handleChange}
                required
                placeholder=" "
                disabled={isLoading}
              />
              <span className="floating-label">Password</span>
              <button
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {signUpForm.password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: `${(passwordStrength / 5) * 100}%`,
                    backgroundColor: getPasswordStrengthColor(),
                  }}
                ></div>
              </div>
              <span
                className="strength-text"
                style={{ color: getPasswordStrengthColor() }}
              >
                {getPasswordStrengthText()}
              </span>
            </div>
          )}
        </div>

        <div className="input-group">
          <label className="signup-label password-field">
            <div className="input-container">
              <CheckCircle className="input-icon" size={20} />
              <input
                className="signup-input"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={signUpForm.confirmPassword}
                onChange={handleChange}
                required
                placeholder=" "
                disabled={isLoading}
              />
              <span className="floating-label">Confirm Password</span>
              <button
                type="button"
                className="password-toggle-btn"
                onClick={toggleConfirmPasswordVisibility}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {signUpForm.confirmPassword && (
            <div className="password-match">
              {signUpForm.password === signUpForm.confirmPassword ? (
                <span className="match-success">
                  <CheckCircle size={16} />
                  Passwords match
                </span>
              ) : (
                <span className="match-error">Passwords do not match</span>
              )}
            </div>
          )}
        </div>

        <button
          className={`signup-submit-btn ${isLoading ? "loading" : ""}`}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner"></div>
              Creating Account...
            </>
          ) : (
            <>
              <UserPlus size={20} />
              Create Account
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SignUp;
