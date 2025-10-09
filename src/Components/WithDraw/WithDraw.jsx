import React, { useContext, useState, useEffect } from "react";
import "./WithDraw.css";
import { userDataContext } from "../../AppContexts";
import supabase from "../../SupabaseClient";
import { toast } from "react-toastify";
import CredentialVerificationModal from "./CredentialVerificationModal/CredentialVerificationModal";

const WithDraw = () => {
  const { userData } = useContext(userDataContext);
  const [paymentMethod, setPaymentMethod] = useState(""); // 'vodafone' or 'instapay'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequestInfo, setPendingRequestInfo] = useState(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);

  const [formData, setFormData] = useState({
    withDrawalPhone: userData?.phone || "",
    vodaCarrierName: "",
    instaEmail: "",
    instaAccountName: "",
  });

  const [errors, setErrors] = useState({});

  // Check for pending withdrawal requests on component load
  useEffect(() => {
    const checkPendingRequests = async () => {
      if (!userData?.id) return;

      try {
        const { data: existingRequests, error } = await supabase
          .from("WithDrawalRequests")
          .select("id, created_at, actualBalance, Status")
          .eq("brokerId", userData.id)
          .eq("Status", false)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error checking pending requests:", error);
          return;
        }

        if (existingRequests && existingRequests.length > 0) {
          setHasPendingRequest(true);
          setPendingRequestInfo(existingRequests[0]);
        } else {
          setHasPendingRequest(false);
          setPendingRequestInfo(null);
        }
      } catch (error) {
        console.error("Error checking pending requests:", error);
      }
    };

    checkPendingRequests();

    // Set up real-time subscription for withdrawal requests
    const withdrawalSubscription = supabase
      .channel("withdrawal_requests_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "WithDrawalRequests",
          filter: `brokerId=eq.${userData?.id}`,
        },
        (payload) => {
          console.log("Real-time withdrawal request update:", payload);

          if (payload.eventType === "UPDATE") {
            // Check if the request status changed to finished (true)
            if (payload.new.Status === true && payload.old.Status === false) {
              console.log("Withdrawal request completed!");
              toast.success("🎉 Your withdrawal request has been processed!");

              // Update local state to remove pending request
              setHasPendingRequest(false);
              setPendingRequestInfo(null);
            }
          } else if (payload.eventType === "INSERT") {
            // New withdrawal request added
            if (payload.new.Status === false) {
              console.log("New pending withdrawal request added");
              setHasPendingRequest(true);
              setPendingRequestInfo(payload.new);
            }
          }
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(withdrawalSubscription);
    };
  }, [userData?.id]);

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
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCredentialVerified = async () => {
    setShowCredentialModal(false);
    await submitWithdrawalRequest();
  };

  const openCredentialModal = () => {
    setShowCredentialModal(true);
  };

  const closeCredentialModal = () => {
    setShowCredentialModal(false);
  };

  const validateForm = () => {
    const newErrors = {};

    // Phone validation
    if (!formData.withDrawalPhone.trim()) {
      newErrors.withDrawalPhone = "Phone number is required";
    } else if (
      !/^[0-9]{10,15}$/.test(formData.withDrawalPhone.replace(/\s/g, ""))
    ) {
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

      if (
        formData.instaEmail.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.instaEmail)
      ) {
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

    // Check for existing pending withdrawal requests
    try {
      const { data: existingRequests, error: checkError } = await supabase
        .from("WithDrawalRequests")
        .select("id, created_at, actualBalance")
        .eq("brokerId", userData.id)
        .eq("Status", false); // false means pending

      if (checkError) {
        console.error("Error checking existing requests:", checkError);
        toast.error("Unable to verify existing requests. Please try again.");
        return;
      }

      if (existingRequests && existingRequests.length > 0) {
        const latestRequest = existingRequests[0];
        const requestDate = new Date(
          latestRequest.created_at
        ).toLocaleDateString();
        const requestAmount = parseFloat(
          latestRequest.actualBalance
        ).toLocaleString("en-US", {
          style: "currency",
          currency: "EGP",
        });

        toast.error(
          `❌ You already have a pending withdrawal request!\n\n` +
            `📋 **Existing Request:**\n` +
            `• Amount: ${requestAmount}\n` +
            `• Date: ${requestDate}\n` +
            `• Status: ⏳ Pending Review\n\n` +
            `⏳ Please wait for your current request to be processed before submitting a new one.`
        );
        return;
      }
    } catch (error) {
      console.error("Error checking pending requests:", error);
      toast.error("Unable to verify existing requests. Please try again.");
      return;
    }

    // Show credential verification modal for authentication
    openCredentialModal();
  };

  const submitWithdrawalRequest = async () => {
    setIsSubmitting(true);

    try {
      // First, fetch all completed orders for this broker to get their IDs
      const { data: completedOrders, error: ordersError } = await supabase
        .from("Orders")
        .select("id")
        .eq("brokerId", userData.id)
        .eq("status", true);

      if (ordersError) {
        console.error("Error fetching orders:", ordersError);
        toast.error("Error fetching orders. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Extract order IDs
      const orderIds = completedOrders?.map((order) => order.id) || [];

      const withdrawalData = {
        brokerId: userData.id,
        brokerEmail: userData.email,
        brokerPhone: userData.phone,
        brokerName: userData.fullName,
        withDrawalPhone: formData.withDrawalPhone.trim() || null,
        isVodafone: paymentMethod === "vodafone",
        vodaCarrierName:
          paymentMethod === "vodafone" ? formData.vodaCarrierName.trim() : null,
        isInstaPay: paymentMethod === "instapay",
        instaEmail:
          paymentMethod === "instapay" && formData.instaEmail.trim()
            ? formData.instaEmail.trim()
            : null,
        instaAccountName:
          paymentMethod === "instapay" && formData.instaAccountName.trim()
            ? formData.instaAccountName.trim()
            : null,
        actualBalance: userData.actualBalance,
        orders: orderIds, // Store the order IDs in the orders field
      };

      const { error } = await supabase
        .from("WithDrawalRequests")
        .insert([withdrawalData]);

      if (error) {
        console.error("Error:", error);
        toast.error("Error sending request. Please try again.");
      } else {
        toast.success(
          "✅ Withdrawal request submitted successfully!\n\n📱 You'll be notified in real-time when it's processed."
        );
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
            {userData?.actualBalance?.toLocaleString("en-US", {
              style: "currency",
              currency: "EGP",
            }) || "EGP 0.00"}
          </span>
        </div>

        {hasPendingRequest && pendingRequestInfo && (
          <div className="pending-request-alert">
            <div className="alert-icon">⏳</div>
            <div className="alert-content">
              <h3 className="alert-title">Pending Withdrawal Request</h3>
              <div className="alert-details">
                <p>
                  <strong>Amount:</strong>{" "}
                  {parseFloat(pendingRequestInfo.actualBalance).toLocaleString(
                    "en-US",
                    {
                      style: "currency",
                      currency: "EGP",
                    }
                  )}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(pendingRequestInfo.created_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>Status:</strong> ⏳ Under Review
                </p>
              </div>
              <p className="alert-message">
                You already have a withdrawal request pending. Please wait for
                it to be processed before submitting a new one. You'll be
                notified instantly when it's completed!
              </p>
            </div>
          </div>
        )}

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
                  disabled={hasPendingRequest}
                />
                <span className="checkbox-text">Vodafone Cash</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={paymentMethod === "instapay"}
                  onChange={() => handlePaymentMethodChange("instapay")}
                  disabled={hasPendingRequest}
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
                  placeholder={`${
                    paymentMethod === "instapay" ? "InstaPay" : "Vodafone Cash"
                  } Phone Number`}
                  className={`withdraw-input ${
                    errors.withDrawalPhone ? "input-error" : ""
                  }`}
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
                    className={`withdraw-input ${
                      errors.vodaCarrierName ? "input-error" : ""
                    }`}
                  />
                  {errors.vodaCarrierName && (
                    <span className="error-text">{errors.vodaCarrierName}</span>
                  )}
                </div>
              )}

              {paymentMethod === "instapay" && (
                <>
                  <div className="input-group">
                    <label className="input-label">
                      InstaPay Account Email
                    </label>
                    <input
                      type="email"
                      name="instaEmail"
                      value={formData.instaEmail}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      className={`withdraw-input ${
                        errors.instaEmail ? "input-error" : ""
                      }`}
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
                      Either phone or email is required for InstaPay
                      transactions
                    </p>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  handleSubmit();
                }}
                disabled={isSubmitting || hasPendingRequest}
                className={`submit-button ${
                  isSubmitting || hasPendingRequest
                    ? "submit-button-disabled loading"
                    : ""
                }`}
              >
                {isSubmitting
                  ? "Processing..."
                  : hasPendingRequest
                  ? "Request Pending"
                  : "Submit Withdrawal Request"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Credential Verification Modal */}
      <CredentialVerificationModal
        isOpen={showCredentialModal}
        onClose={closeCredentialModal}
        onVerified={handleCredentialVerified}
        brokerEmail={userData?.email}
        title="🔐 Verify Your Identity"
        message="Please confirm your credentials to proceed with this withdrawal request."
      />
    </div>
  );
};

export default WithDraw;
