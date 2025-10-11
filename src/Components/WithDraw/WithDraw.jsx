import React, { useContext, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./WithDraw.css";
import { userDataContext } from "../../AppContexts";
import supabase from "../../SupabaseClient";
import { toast } from "react-toastify";
import CredentialVerificationModal from "./CredentialVerificationModal/CredentialVerificationModal";

const WithDraw = () => {
  const { t } = useTranslation();
  const { userData } = useContext(userDataContext);
  const [paymentMethod, setPaymentMethod] = useState(""); // 'vodafone' or 'instapay'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [pendingRequestInfo, setPendingRequestInfo] = useState(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [brokerVerificationStatus, setBrokerVerificationStatus] =
    useState(null);

  const [formData, setFormData] = useState({
    withDrawalPhone: userData?.phone || "",
    vodaCarrierName: "",
    instaEmail: "",
    instaAccountName: "",
  });

  const [errors, setErrors] = useState({});

  // Check broker verification status and pending withdrawal requests on component load
  useEffect(() => {
    const checkBrokerStatus = async () => {
      if (!userData?.id) return;

      try {
        // Check broker verification status
        const { data: brokerData, error: brokerError } = await supabase
          .from("Brokers")
          .select("isVerified")
          .eq("id", userData.id)
          .single();

        if (brokerError) {
          // Broker verification check error handled silently
        } else {
          setBrokerVerificationStatus(brokerData?.isVerified || false);
        }

        // Check for pending withdrawal requests
        const { data: existingRequests, error } = await supabase
          .from("WithDrawalRequests")
          .select("id, created_at, actualBalance, Status")
          .eq("brokerId", userData.id)
          .eq("Status", false)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          // Error handled silently
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
        // Error handled silently
      }
    };

    checkBrokerStatus();

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
          // Real-time withdrawal request update

          if (payload.eventType === "UPDATE") {
            // Check if the request status changed to finished (true)
            if (payload.new.Status === true && payload.old.Status === false) {
              // Withdrawal request completed
              toast.success(t("withdraw.requestProcessed"));

              // Update local state to remove pending request
              setHasPendingRequest(false);
              setPendingRequestInfo(null);
            }
          } else if (payload.eventType === "INSERT") {
            // New withdrawal request added
            if (payload.new.Status === false) {
              // New pending withdrawal request added
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
      newErrors.withDrawalPhone = t("withdraw.phoneRequired");
    } else if (
      !/^[0-9]{10,15}$/.test(formData.withDrawalPhone.replace(/\s/g, ""))
    ) {
      newErrors.withDrawalPhone = t("withdraw.phoneInvalid");
    }

    // Vodafone specific validation
    if (paymentMethod === "vodafone") {
      if (!formData.vodaCarrierName.trim()) {
        newErrors.vodaCarrierName = t("withdraw.carrierRequired");
      }
    }

    // InstaPay specific validation
    if (paymentMethod === "instapay") {
      if (!formData.instaEmail.trim() && !formData.instaAccountName.trim()) {
        newErrors.instaEmail = t("withdraw.emailOrAccountRequired");
      }

      if (
        formData.instaEmail.trim() &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.instaEmail)
      ) {
        newErrors.instaEmail = t("withdraw.emailInvalid");
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Check if broker is verified
    if (brokerVerificationStatus === false) {
      toast.error(t("withdraw.accountUnderReview"));
      return;
    }

    if (!paymentMethod) {
      toast.warning(t("withdraw.selectPaymentMethod"));
      return;
    }

    if (!validateForm()) {
      toast.error(t("withdraw.fixFormErrors"));
      return;
    }

    if (!userData?.actualBalance || userData.actualBalance <= 0) {
      toast.error(t("withdraw.insufficientBalance"));
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
        toast.error(t("withdraw.unableToVerifyRequests"));
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

        toast.error(t("withdraw.pendingRequestExists"));
        return;
      }
    } catch (error) {
      // Error handled silently
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
        // Error handled silently
        toast.error(t("withdraw.errorFetchingOrders"));
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
        // Error handled silently
        toast.error(t("withdraw.errorSendingRequest"));
      } else {
        toast.success(t("withdraw.requestSubmittedSuccessfully"));
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
      // Unexpected error handled silently
      toast.error(t("withdraw.unexpectedError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="withdraw-container">
      <div className="withdraw-card">
        <h2 className="withdraw-title">{t("withdraw.title")}</h2>

        <div className="balance-info">
          <span className="balance-label">
            {t("withdraw.availableBalance")}:
          </span>
          <span className="balance-amount">
            {userData?.actualBalance?.toLocaleString("en-US", {
              style: "currency",
              currency: "EGP",
            }) || "EGP 0.00"}
          </span>
        </div>

        {/* Account Verification Status */}
        {brokerVerificationStatus === false && (
          <div className="verification-alert">
            <div className="alert-icon">🔒</div>
            <div className="alert-content">
              <h3 className="alert-title">
                {t("withdraw.accountUnderReviewTitle")}
              </h3>
              <p className="alert-message">
                {t("withdraw.accountUnderReviewMessage")}
              </p>
              <div className="alert-actions">
                <span className="contact-support">
                  📞 {t("withdraw.contactSupport")}
                </span>
              </div>
            </div>
          </div>
        )}

        {hasPendingRequest && pendingRequestInfo && (
          <div className="pending-request-alert">
            <div className="alert-icon">⏳</div>
            <div className="alert-content">
              <h3 className="alert-title">
                {t("withdraw.pendingRequestTitle")}
              </h3>
              <div className="alert-details">
                <p>
                  <strong>{t("withdraw.amount")}:</strong>{" "}
                  {parseFloat(pendingRequestInfo.actualBalance).toLocaleString(
                    "en-US",
                    {
                      style: "currency",
                      currency: "EGP",
                    }
                  )}
                </p>
                <p>
                  <strong>{t("withdraw.date")}:</strong>{" "}
                  {new Date(pendingRequestInfo.created_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>{t("withdraw.status")}:</strong> ⏳{" "}
                  {t("withdraw.underReview")}
                </p>
              </div>
              <p className="alert-message">
                {t("withdraw.pendingRequestMessage")}
              </p>
            </div>
          </div>
        )}

        <div
          className={`form-wrapper ${
            brokerVerificationStatus === false ? "form-disabled" : ""
          }`}
        >
          <div className="withdraw-section">
            <label className="section-label">
              {t("withdraw.selectPaymentMethod")}
            </label>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={paymentMethod === "vodafone"}
                  onChange={() => handlePaymentMethodChange("vodafone")}
                  disabled={
                    hasPendingRequest || brokerVerificationStatus === false
                  }
                />
                <span className="checkbox-text">
                  {t("withdraw.vodafoneCash")}
                </span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  className="checkbox-input"
                  checked={paymentMethod === "instapay"}
                  onChange={() => handlePaymentMethodChange("instapay")}
                  disabled={
                    hasPendingRequest || brokerVerificationStatus === false
                  }
                />
                <span className="checkbox-text">{t("withdraw.instapay")}</span>
              </label>
            </div>
          </div>

          {paymentMethod && (
            <div className="payment-form">
              <div className="input-group">
                <label className="input-label">
                  {t("withdraw.phoneNumber")}{" "}
                  <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  name="withDrawalPhone"
                  value={formData.withDrawalPhone}
                  onChange={handleInputChange}
                  placeholder={`${
                    paymentMethod === "instapay"
                      ? t("withdraw.instapay")
                      : t("withdraw.vodafoneCash")
                  } ${t("withdraw.phoneNumber")}`}
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
                    {t("withdraw.carrierName")}{" "}
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="vodaCarrierName"
                    value={formData.vodaCarrierName}
                    onChange={handleInputChange}
                    placeholder={t("withdraw.vodafoneAccountPlaceholder")}
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
                      {t("withdraw.instapayEmail")}
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
                    <label className="input-label">
                      {t("withdraw.instapayAccountName")}
                    </label>
                    <input
                      type="text"
                      name="instaAccountName"
                      value={formData.instaAccountName}
                      onChange={handleInputChange}
                      placeholder={t("withdraw.instapayAccountPlaceholder")}
                      className="withdraw-input"
                    />
                  </div>

                  <div className="info-box">
                    <p className="info-text">{t("withdraw.instapayInfo")}</p>
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  handleSubmit();
                }}
                disabled={
                  isSubmitting ||
                  hasPendingRequest ||
                  brokerVerificationStatus === false
                }
                className={`submit-button ${
                  isSubmitting ||
                  hasPendingRequest ||
                  brokerVerificationStatus === false
                    ? "submit-button-disabled loading"
                    : ""
                }`}
              >
                {isSubmitting
                  ? t("withdraw.processing")
                  : hasPendingRequest
                  ? t("withdraw.requestPending")
                  : brokerVerificationStatus === false
                  ? t("withdraw.accountUnderReview")
                  : t("withdraw.submitRequest")}
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
        title={t("withdraw.verifyIdentity")}
        message={t("withdraw.verifyMessage")}
      />
    </div>
  );
};

export default WithDraw;
