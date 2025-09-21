import React, { useState, useEffect, useContext } from "react";
import "./CheckOut.css";
import { cartContext } from "../../AppContexts";

const CheckOut = () => {
  const [visible, setVisible] = useState(false);

  // ✅ Use cart context instead of local state
  const { cart } = useContext(cartContext);

  // ✅ form state
  const [form, setForm] = useState({
    brokerId: JSON.parse(localStorage.getItem("brokerId") || "null") || "",
    name: "",
    address: "",
    phone: "",
    notes: "",
    date: "",
    cart: cart,
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
  });

  // ✅ Update form when cart changes from context
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      cart: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }));
  }, [cart]);

  // ✅ Listen for changes in localStorage (for cross-tab synchronization)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "cart") {
        // This will be handled by the cart context in App.jsx
        // No need to update local state here anymore
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ handle form submit
  const handleSubmit = () => {
    alert("Order submitted!");
    console.log("Order Data:", form);
  };

  return (
    <>
      {cart.length > 0 && (
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
                  setForm((prev) => ({
                    ...prev,
                    date: new Date().toLocaleString(),
                  }));
                  setTimeout(() => {
                    handleSubmit();
                  }, 500);
                }}
              >
                Submit Order
              </button>
            </form>
          </div>
        </>
      )}
    </>
  );
};

export default CheckOut;
