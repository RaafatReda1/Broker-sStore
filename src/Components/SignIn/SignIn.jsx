import React, { useContext, useState } from "react";
import "./SignIn.css";
import supabase from "../../SupabaseClient";
import { sessionContext } from "../../AppContexts";
import { toast } from "react-toastify";
import { Mail, Lock, Eye, EyeOff, LogIn, User } from "lucide-react";
import { Link } from "react-router-dom";
const SignIn = () => {
  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { session } = useContext(sessionContext);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  if (session) {
    window.location.href = "/";
  }
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignInForm({ ...signInForm, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInForm.email,
        password: signInForm.password,
      });

      if (error) {
        console.error("Error during sign in:", error);
        toast.error("Sign in failed. Please check your credentials.");
      } else if (data) {
        toast.success("Welcome back! Sign in successful!");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-parent">
      <div className="signin-header">
        <div className="signin-icon">
          <User size={32} />
        </div>
        <h1 className="signin-title">Welcome Back</h1>
        <p className="signin-subtitle">Sign in to your account</p>
      </div>

      <form className="signin-form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label className="signin-label">
            <div className="input-container">
              <Mail className="input-icon" size={20} />
              <input
                className="signin-input"
                type="email"
                name="email"
                value={signInForm.email}
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
          <label className="signin-label password-field">
            <div className="input-container">
              <Lock className="input-icon" size={20} />
              <input
                className="signin-input"
                type={showPassword ? "text" : "password"}
                name="password"
                value={signInForm.password}
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
        </div>

        <button
          className={`signin-submit-btn ${isLoading ? "loading" : ""}`}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner"></div>
              Signing In...
            </>
          ) : (
            <>
              <LogIn size={20} />
              Sign In
            </>
          )}
        </button>
        <div className="signin-footer">
          <Link to={"/requestreset"} className="forgot-password-link">
            <span className="forgot-password-text">Forgot Password?</span>
            <span className="forgot-password-icon">→</span>
          </Link>
        </div>
      </form>
    </div>
  );
};

export default SignIn;
