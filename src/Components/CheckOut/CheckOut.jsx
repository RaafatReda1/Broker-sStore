import React, { useState } from "react";
import "./CheckOut.css";

const CheckOut = () => {
  const [visible, setVisible] = useState(false);
  const Cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const [form, setForm] = useState({
    brokerId: JSON.parse(localStorage.getItem("brokerId") || "null") || "",
    name: "",
    address: "",
    phone: "",
    notes: "",
    date: "",
    cart: JSON.parse(localStorage.getItem("cart") || "[]"),
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    alert("Order submitted!");
  };

  return (
    <>
      {Cart.length > 0 && 
      <>
        <button
        className={"checkout-toggle-btn" + (visible ? "active" : "")}
        onClick={() => {
          setVisible((v) => !v);
          visible
            ? window.scrollTo({ top: 50, behavior: "smooth" })
            : setTimeout(() => {
                window.scrollTo({
                  top: document.body.scrollHeight - 200,
                  behavior: "smooth",
                });
              }, 200);
        }}
      >
        {visible ? "Still shopping?" : "Let's Checkout"}
      </button>
      <div className={`checkout-parent ${visible ? "show" : ""}`}>
        <form className={`checkout-form${visible ? "" : " hide"}`}>
        <h2 className="checkout-title">Checkout</h2>
          <label className="checkout-label">
            <input
              className="checkout-input"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder=" "
              
            />
            <span className="floating-label">Name</span>
          </label>
          <label className="checkout-label">
            <input
              className="checkout-input"
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              placeholder=" "
            />
            <span className="floating-label">Address</span>
          </label>
          <label className="checkout-label">
            <input
              className="checkout-input"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder=" "
              pattern="[0-9]{10,15}"
            />
            <span className="floating-label">Phone</span>
          </label>
          <label className="checkout-label">
            <textarea
              className="checkout-input checkout-notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder=" "
            />
            <span className="floating-label">Notes</span>
          </label>
                  <button
            className="checkout-submit-btn"
            type="button"
            onClick={() => {
              setForm({ ...form, date: new Date().toLocaleString() });
              setTimeout(() => {
                handleSubmit();
                console.log(form);
              }, 2000);
            }}
          >
            Submit Order
          </button>
        </form>

      </div>
      
      </>}</>
    
  );
};

export default CheckOut;
