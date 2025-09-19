import React, { useContext, useState } from "react";
import "./BrokersDataForm.css";
import { sessionContext, userContext } from "../../../AppContexts";
import supabase from "../../../SupabaseClient";

const BrokersDataForm = () => {
  const [brokerForm, setBrokerForm] = useState({
    fullName: "",
    nickname: "",
    phone: "",
    idFront: null,
    idBack: null,
  });
  const { session } = useContext(sessionContext);

  const { user } = useContext(userContext);
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setBrokerForm({ ...brokerForm, [name]: files[0] });
    } else {
      setBrokerForm({ ...brokerForm, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (session) {
      const { data, err } = await supabase.from("Brokers").insert({
        fullName: brokerForm.fullName,
        nickName: brokerForm.nickname,
        phone: brokerForm.phone,
        email: user.email,
        auth_id: user.id,
      });
      if (err) {
        console.log(err);
        alert("Error submitting broker data. Please try again.");
        return;
      } else if (data) {
        alert("Broker data submitted successfully!");
      }
    }
  };

  return (
    <div className="broker-parent">
      <form className="broker-form" onSubmit={handleSubmit}>
        <h1 className="broker-title">Broker Information</h1>
        <div className="names">
          <label className="broker-label name-field">
            <input
              className="broker-input"
              type="text"
              name="fullName"
              value={brokerForm.fullName}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <span className="floating-label">Full Name</span>
          </label>
          <label className="broker-label name-field nickname-field">
            <input
              className="broker-input"
              type="text"
              name="nickname"
              value={brokerForm.nickname}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <span className="floating-label">Nickname</span>
          </label>
        </div>

        <label className="broker-label">
          <input
            className="broker-input"
            type="tel"
            name="phone"
            value={brokerForm.phone}
            onChange={handleChange}
            required
            placeholder=" "
            pattern="[0-9]{10,15}"
          />
          <span className="floating-label">Phone Number</span>
        </label>

        <label className="broker-label" id="idCardLabel">
          ID Card Front Photo
          <input
            className="broker-input broker-file"
            type="file"
            name="idFront"
            accept="image/*"
            onChange={handleChange}
            required
          />
        </label>

        <label className="broker-label" id="idCardLabel">
          ID Card Back Photo
          <input
            className="broker-input broker-file"
            type="file"
            name="idBack"
            accept="image/*"
            onChange={handleChange}
            required
          />
        </label>

        <button className="broker-submit-btn" type="submit">
          Submit Broker Data
        </button>
      </form>
    </div>
  );
};

export default BrokersDataForm;
