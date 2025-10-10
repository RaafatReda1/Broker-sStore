import React, { useState, useEffect, useContext } from "react";
import "./CheckOut.css";
import { cartContext } from "../../AppContexts";
import supabase from "../../SupabaseClient";
import { toast } from "react-toastify";
import {
  CreditCard,
  User,
  MapPin,
  Phone,
  FileText,
  ShoppingBag,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import NotificationService from "../../utils/notificationService";

const CheckOut = () => {
  const [visible, setVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // ✅ Use cart context instead of local state
  const { cart } = useContext(cartContext);

  // ✅ form state
  const [form, setForm] = useState({
    brokerId: JSON.parse(localStorage.getItem("brokerId") || "null") || 45,
    name: "",
    address: "",
    phone: "",
    notes: "",
    // date: "", this feild is deleted at the DB for now
    cart: cart,
    total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    //adding the net profit logic
    netProfit: cart.reduce((sum, product) => {
      return sum + product.profit * product.quantity;
    }, 0),
  });

  // ✅ Update form when cart changes from context
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      cart: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      netProfit: cart.reduce((sum, product) => {
        return sum + product.profit * product.quantity;
      }, 0),
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
  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.phone) {
      toast.error("Please fill in all required fields!");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("Orders")
        .insert([form])
        .select(); // ✅ علشان يرجعلك الـ data المدخلة

      if (error) {
        toast.error(`Error: ${error.message}`);
        return;
      } else if (data && data.length > 0) {
        setOrderSuccess(true);
        toast.success("Order placed successfully!");

        // Send notification to broker about new order
        const newOrder = data[0];
        console.log("🛒 Order created successfully:", newOrder);
        console.log("🛒 BrokerId from order:", newOrder.brokerId);

        try {
          const notificationResult = await NotificationService.notifyNewOrder(
            newOrder
          );
          console.log("🔔 Notification result:", notificationResult);
          if (notificationResult) {
            console.log(
              "✅ New order notification sent to broker successfully"
            );
          } else {
            console.log("❌ Failed to send new order notification");
          }
        } catch (error) {
          console.error("❌ Error sending new order notification:", error);
          // Don't show error to user as order was successful
        }

        // Reset form after success
        setTimeout(() => {
          setForm({
            brokerId: JSON.parse(localStorage.getItem("brokerId")),
            name: "",
            address: "",
            phone: "",
            notes: "",
            cart: cart,
            total: cart.reduce(
              (sum, item) => sum + item.price * item.quantity,
              0
            ),
            netProfit: cart.reduce((sum, product) => {
              return sum + product.profit * product.quantity;
            }, 0),
          });
          setOrderSuccess(false);
          setVisible(false);
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      toast.error("Unexpected error occurred! " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {cart.length > 0 && (
        <>
          <button
            className={`checkout-toggle-btn ${visible ? "active" : ""}`}
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
            <ShoppingBag size={20} />
            {visible ? "Still shopping?" : "Proceed to Checkout"}
            <ArrowRight size={16} />
          </button>

          <div className={`checkout-parent ${visible ? "show" : ""}`}>
            <div className="checkout-form">
              <div className="checkout-header">
                <h2 className="checkout-title">
                  <CreditCard size={28} />
                  Checkout
                </h2>
                <div className="order-summary">
                  <div className="summary-item">
                    <span>Items:</span>
                    <span>{cart.length}</span>
                  </div>
                  <div className="summary-item">
                    <span>Total:</span>
                    <span className="total-price">
                      ${form.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {orderSuccess ? (
                <div className="success-state">
                  <CheckCircle className="success-icon" size={64} />
                  <h3>Order Placed Successfully!</h3>
                  <p>
                    Thank you for your order. We&apos;ll process it shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="form-section">
                    <h3 className="section-title">
                      <User size={20} />
                      Personal Information
                    </h3>

                    <label className="checkout-label">
                      <input
                        className="checkout-input"
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder=" "
                        disabled={isSubmitting}
                      />
                      <span className="floating-label">Full Name *</span>
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
                        disabled={isSubmitting}
                      />
                      <span className="floating-label">Phone Number *</span>
                    </label>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">
                      <MapPin size={20} />
                      Delivery Information
                    </h3>

                    <label className="checkout-label">
                      <input
                        className="checkout-input"
                        type="text"
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        required
                        placeholder=" "
                        disabled={isSubmitting}
                      />
                      <span className="floating-label">Delivery Address *</span>
                    </label>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">
                      <FileText size={20} />
                      Additional Information
                    </h3>

                    <label className="checkout-label">
                      <textarea
                        className="checkout-input checkout-notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder=" "
                        disabled={isSubmitting}
                      />
                      <span className="floating-label">
                        Order Notes (Optional)
                      </span>
                    </label>
                  </div>

                  <button
                    className="checkout-submit-btn"
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    <span className="button-content">
                      {isSubmitting ? (
                        <span className="loading-content">
                          Processing Order...
                        </span>
                      ) : (
                        <span className="normal-content">
                          <CreditCard size={20} />
                          Place Order
                        </span>
                      )}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CheckOut;
