import React, { useContext, useState, useEffect } from "react";
import "./WithDraw.css";
import { userDataContext } from "../../AppContexts";
import supabase from "../../SupabaseClient";
import { toast } from "react-toastify";

const WithDraw = () => {
  const { userData } = useContext(userDataContext);
  const [paymentMethod, setPaymentMethod] = useState(""); // 'vodafone' or 'instapay'
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    withDrawalPhone: userData?.phone || "",
    vodaCarrierName: "",
    instaEmail: "",
    instaAccountName: "",
  });

  const [errors, setErrors] = useState({});

  // Reset form when payment method changes
  useEffect(() => {
    setFormData({
      withDrawalPhone: userData?.phone || "",
      vodaCarrierName: "",
      instaEmail: "",
      instaAccountName: "",
    });
    setErrors({});
  }, [paymentMethod, userData?.phone]);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(paymentMethod === method ? "" : method);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Phone validation
    if (!formData.withDrawalPhone.trim()) {
      newErrors.withDrawalPhone = "Phone number is required";
    } else if (!/^[0-9]{10,15}$/.test(formData.withDrawalPhone.replace(/\s/g, ""))) {
      newErrors.withDrawalPhone = "Please enter a valid phone number";
    }

    // Vodafone specific validation
    if (paymentMethod === "vodafone") {
      if (!formData.vodaCarrierName.trim()) {
        newErrors.vodaCarrierName = "Carrier name is required";
      }
    }

    // InstaPay specific validation
    if (paymentMethod === "instapay") {
      if (!formData.instaEmail.trim() && !formData.instaAccountName.trim()) {
        newErrors.instaEmail = "Please provide either email or account name";
      }
      
      if (formData.instaEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.instaEmail)) {
        newErrors.instaEmail = "Please enter a valid email address";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!paymentMethod) {
      toast.warning("Please select a payment method");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    if (!userData?.actualBalance || userData.actualBalance <= 0) {
      toast.error("Insufficient balance for withdrawal");
      return;
    }

    setIsSubmitting(true);

    try {
      const withdrawalData = {
        brokerId: userData.id,
        brokerEmail: userData.email,
        brokerPhone: userData.phone,
        brokerName: userData.fullName,
        withDrawalPhone: formData.withDrawalPhone.trim() || null,
        isVodafone: paymentMethod === "vodafone",
        vodaCarrierName: paymentMethod === "vodafone" ? formData.vodaCarrierName.trim() : null,
        isInstaPay: paymentMethod === "instapay",
        instaEmail: paymentMethod === "instapay" && formData.instaEmail.trim() ? formData.instaEmail.trim() : null,
        instaAccountName: paymentMethod === "instapay" && formData.instaAccountName.trim() ? formData.instaAccountName.trim() : null,
        actualBalance: userData.actualBalance
      };

      const { error } = await supabase
        .from("WithDrawalRequests")
        .insert([withdrawalData]);

      if (error) {
        console.error("Error:", error);
        toast.error("Error sending request. Please try again.");
      } else {
        toast.success("Withdrawal request submitted successfully!");
        // Reset form
        setPaymentMethod("");
        setFormData({
          withDrawalPhone: userData?.phone || "",
          vodaCarrierName: "",
          instaEmail: "",
          instaAccountName: "",
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="withdraw-container">
      <div className="withdraw-card">
        <h2 className="withdraw-title">Request Withdrawal</h2>
        
        <div className="balance-info">
          <span className="balance-label">Available Balance:</span>
          <span className="balance-amount">
            {userData?.actualBalance?.toLocaleString('en-US', {
              style: 'currency',
              currency: 'EGP'
            }) || 'EGP 0.00'}
          </span>
        </div>

        <div className="form-wrapper">
          <div className="withdraw-section">
            <label className="section-label">Select Payment Method</label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={paymentMethod === "vodafone"}
                  onChange={() => handlePaymentMethodChange("vodafone")}
                />
                <span className="checkbox-text">Vodafone Cash</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={paymentMethod === "instapay"}
                  onChange={() => handlePaymentMethodChange("instapay")}
                />
                <span className="checkbox-text">InstaPay</span>
              </label>
            </div>
          </div>

          {paymentMethod && (
            <div className="payment-form">
              <div className="input-group">
                <label className="input-label">
                  Phone Number <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="withDrawalPhone"
                  value={formData.withDrawalPhone}
                  onChange={handleInputChange}
                  placeholder={`${paymentMethod === "instapay" ? "InstaPay" : "Vodafone Cash"} Phone Number`}
                  className={`withdraw-input ${errors.withDrawalPhone ? 'input-error' : ''}`}
                />
                {errors.withDrawalPhone && (
                  <span className="error-text">{errors.withDrawalPhone}</span>
                )}
              </div>

              {paymentMethod === "vodafone" && (
                <div className="input-group">
                  <label className="input-label">
                    Carrier Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="vodaCarrierName"
                    value={formData.vodaCarrierName}
                    onChange={handleInputChange}
                    placeholder="Full name on Vodafone Cash account"
                    className={`withdraw-input ${errors.vodaCarrierName ? 'input-error' : ''}`}
                  />
                  {errors.vodaCarrierName && (
                    <span className="error-text">{errors.vodaCarrierName}</span>
                  )}
                </div>
              )}

              {paymentMethod === "instapay" && (
                <>
                  <div className="input-group">
                    <label className="input-label">InstaPay Account Email</label>
                    <input
                      type="email"
                      name="instaEmail"
                      value={formData.instaEmail}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className={`withdraw-input ${errors.instaEmail ? 'input-error' : ''}`}
                    />
                    {errors.instaEmail && (
                      <span className="error-text">{errors.instaEmail}</span>
                    )}
                  </div>

                  <div className="input-group">
                    <label className="input-label">InstaPay Account Name</label>
                    <input
                      type="text"
                      name="instaAccountName"
                      value={formData.instaAccountName}
                      onChange={handleInputChange}
                      placeholder="Full name on InstaPay account"
                      className="withdraw-input"
                    />
                  </div>

                  <div className="info-box">

                    <p className="info-text">
                      Either phone or email is required for InstaPay transactions
                    </p>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`submit-button ${isSubmitting ? 'submit-button-disabled loading' : ''}`}
              >
                {isSubmitting ? "Processing..." : "Submit Withdrawal Request"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WithDraw;