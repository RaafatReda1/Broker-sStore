import React, { useState } from "react";
import "./Signup.css";

const SignUp = () => {
  const [signUpForm, setSignUpForm] = useState({
    fullName: "",
    nickname: "",
    phone: "",
    idFront: null,
    idBack: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setSignUpForm({ ...signUpForm, [name]: files[0] });
    } else {
      setSignUpForm({ ...signUpForm, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission logic here
    alert("Sign up submitted!");
  };

  return (
    <div className="signup-parent">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h1 className="signup-title">Sign Up</h1>
        <label className="signup-label">
          <input
            className="signup-input"
            type="text"
            name="fullName"
            value={signUpForm.fullName}
            onChange={handleChange}
            required
            placeholder=" "
          />
          <span className="floating-label">Full Name</span>
        </label>
        <label className="signup-label">
          <input
            className="signup-input"
            type="text"
            name="nickname"
            value={signUpForm.nickname}
            onChange={handleChange}
            required
            placeholder=" "
          />
          <span className="floating-label">Nickname</span>
        </label>
        <label className="signup-label">
          <input
            className="signup-input"
            type="tel"
            name="phone"
            value={signUpForm.phone}
            onChange={handleChange}
            required
            placeholder=" "
            pattern="[0-9]{10,15}"
          />
          <span className="floating-label">Phone Number</span>
        </label>
        <label className="signup-label" id="idCardLabel">
          ID Card Front Photo
          <input
            className="signup-input signup-file"
            type="file"
            name="idFront"
            accept="image/*"
            onChange={handleChange}
            required
          />
        </label>
        <label className="signup-label" id="idCardLabel">
          ID Card Back Photo
          <input
            className="signup-input signup-file"
            type="file"
            name="idBack"
            accept="image/*"
            onChange={handleChange}
            required
          />
        </label>
        <button className="signup-submit-btn" type="submit">
          Submit
        </button>
      </form>
    </div>
  );
};

export default SignUp;
