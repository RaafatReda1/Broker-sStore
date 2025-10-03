import React, { useContext, useState } from "react";
import "./SignIn.css";
import supabase from "../../SupabaseClient";
import { sessionContext } from "../../AppContexts";
const SignIn = () => {
  const [signInForm, setSignInForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const {session} = useContext(sessionContext);
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  if(session){
    window.location.href = "/";
  }
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignInForm({ ...signInForm, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await supabase.auth.signInWithPassword({
        email: signInForm.email,
        password: signInForm.password,
      });
      alert("signed in successfully");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="signin-parent">
      <form className="signin-form" onSubmit={handleSubmit}>
        <h1 className="signin-title">Sign In</h1>
        <label className="signin-label">
          <input
            className="signin-input"
            type="email"
            name="email"
            value={signInForm.email}
            onChange={handleChange}
            required
            placeholder=" "
          />
          <span className="floating-label">Email</span>
        </label>
        <label className="signin-label password-field">
          <input
            className="signin-input"
            type={showPassword ? "text" : "password"}
            name="password"
            value={signInForm.password}
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
        <button className="signin-submit-btn" type="submit">
          Sign In
        </button>
      </form>
    </div>
  );
};

export default SignIn;
