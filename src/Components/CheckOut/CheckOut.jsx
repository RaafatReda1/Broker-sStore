import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
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
//test
const CheckOut = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // ✅ Use cart context instead of local state
  const { cart } = useContext(cartContext);

  // ✅ form state
  const [form, setForm] = useState(() => {
    const storedBrokerId = localStorage.getItem("brokerId");
    const parsedBrokerId = storedBrokerId ? JSON.parse(storedBrokerId) : null;
    console.log(
      "🔍 Initial brokerId from localStorage:",
      storedBrokerId,
      "Parsed:",
      parsedBrokerId
    );

    return {
      brokerId: parsedBrokerId,
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
    };
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
      toast.error(t("errors.fillRequiredFields"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if brokerId exists in brokers table
      let validatedBrokerId = form.brokerId;
      console.log(
        "🔍 Original brokerId:",
        form.brokerId,
        "Type:",
        typeof form.brokerId
      );

      if (form.brokerId && form.brokerId !== null && form.brokerId !== "null") {
        // Convert to number if it's a string
        const brokerIdToCheck =
          typeof form.brokerId === "string"
            ? parseInt(form.brokerId, 10)
            : form.brokerId;
        console.log(
          "🔍 Checking broker existence for ID:",
          brokerIdToCheck,
          "Original:",
          form.brokerId
        );

        const { data: brokerData, error: brokerError } = await supabase
          .from("Brokers")
          .select("id")
          .eq("id", brokerIdToCheck);

        console.log("🔍 Broker query result:", { brokerData, brokerError });

        if (brokerError) {
          console.log("⚠️ Broker query error:", brokerError.message);
          // Database error - keep original brokerId
          console.log("⚠️ Database error, keeping original brokerId");
        } else if (!brokerData || brokerData.length === 0) {
          console.log(
            "⚠️ No broker found with ID:",
            brokerIdToCheck,
            "setting to null"
          );
          validatedBrokerId = null;
        } else {
          console.log("✅ Broker found:", brokerData[0]);
        }
      } else {
        console.log(
          "ℹ️ No brokerId or brokerId is null/undefined, keeping as is"
        );
      }

      // Create order data with validated brokerId
      console.log("🔍 Final validated brokerId:", validatedBrokerId);
      const orderData = {
        ...form,
        brokerId: validatedBrokerId,
      };

      const { data, error } = await supabase
        .from("Orders")
        .insert([orderData])
        .select(); // ✅ علشان يرجعلك الـ data المدخلة

      if (error) {
        toast.error(t("errors.generic"));
        return;
      } else if (data && data.length > 0) {
        setOrderSuccess(true);
        toast.success(t("success.orderPlaced"));

        // Send notification to broker about new order (only if brokerId is valid)
        const newOrder = data[0];
        console.log("🛒 Order created successfully:", newOrder);
        console.log("🛒 BrokerId from order:", newOrder.brokerId);

        if (newOrder.brokerId) {
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
        } else {
          console.log("ℹ️ No broker ID, skipping notification");
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
      toast.error(t("errors.generic"));
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
            {visible
              ? t("checkout.stillShopping")
              : t("checkout.proceedToCheckout")}
            <ArrowRight size={16} />
          </button>

          <div className={`checkout-parent ${visible ? "show" : ""}`}>
            <div className="checkout-form">
              <div className="checkout-header">
                <h2 className="checkout-title">
                  <CreditCard size={28} />
                  {t("checkout.title")}
                </h2>
                <div className="order-summary">
                  <div className="summary-item">
                    <span>{t("checkout.items")}:</span>
                    <span>{cart.length}</span>
                  </div>
                  <div className="summary-item">
                    <span>{t("checkout.total")}:</span>
                    <span className="total-price">
                      ${form.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {orderSuccess ? (
                <div className="success-state">
                  <CheckCircle className="success-icon" size={64} />
                  <h3>{t("checkout.orderSuccess")}</h3>
                  <p>{t("checkout.thankYou")}</p>
                </div>
              ) : (
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="form-section">
                    <h3 className="section-title">
                      <User size={20} />
                      {t("checkout.personalInfo")}
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
                      <span className="floating-label">
                        {t("checkout.fullName")}
                      </span>
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
                      <span className="floating-label">
                        {t("checkout.phoneNumber")}
                      </span>
                    </label>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">
                      <MapPin size={20} />
                      {t("checkout.deliveryInfo")}
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
                      <span className="floating-label">
                        {t("checkout.deliveryAddress")}
                      </span>
                    </label>
                  </div>

                  <div className="form-section">
                    <h3 className="section-title">
                      <FileText size={20} />
                      {t("checkout.additionalInfo")}
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
                        {t("checkout.orderNotes")}
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
                          {t("checkout.processingOrder")}
                        </span>
                      ) : (
                        <span className="normal-content">
                          <CreditCard size={20} />
                          {t("checkout.placeOrder")}
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
