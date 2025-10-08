import supabase from "../SupabaseClient";
import { toast } from "react-toastify";

/**
 * Fetches user data by email from either Brokers or Staff table
 * @param {string} email - User's email address
 * @param {function} setUserData - State setter function for user data
 * @param {function} setIsAdmin - State setter function for admin status
 * @param {function} setIsModerator - State setter function for moderator status
 * @param {function} setLoading - Optional loading state setter
 * @param {boolean} showToast - Whether to show error toast (default: true)
 * @returns {Promise<Object|null>} - User data object with role information or null
 */
export const fetchUserData = async (
  email,
  setUserData,
  setIsAdmin,
  setIsModerator,
  setLoading = null,
  showToast = true
) => {
  if (!email) return null;

  if (setLoading) setLoading(true);

  try {
    // First, check if user is in Staff table
    const { data: staffData, error: staffError } = await supabase
      .from("Staff")
      .select("*")
      .eq("email", email);

    if (staffError) {
      console.error("Error fetching staff data:", staffError.message);
    }

    // If user is staff member
    if (staffData && staffData.length > 0) {
      const staff = staffData[0];
      const userWithRole = {
        ...staff,
        role: staff.authority === "admin" ? "admin" : "moderator",
        userType: "staff",
      };

      setUserData(userWithRole);

      // Set role based on authority
      if (staff.authority === "admin") {
        setIsAdmin(true);
        setIsModerator(false);
        console.log("🔑 User role: ADMIN");
      } else if (staff.authority === "moderator") {
        setIsAdmin(false);
        setIsModerator(true);
        console.log("👮 User role: MODERATOR");
      }

      return userWithRole;
    }

    // If not staff, check Brokers table
    const { data: brokerData, error: brokerError } = await supabase
      .from("Brokers")
      .select("*")
      .eq("email", email);

    if (brokerError) {
      console.error("Error fetching broker data:", brokerError.message);
      if (showToast) {
        toast.error("Failed to load profile data. Please try again.");
      }
      return null;
    }

    // If user is broker
    if (brokerData && brokerData.length > 0) {
      const broker = brokerData[0];
      const userWithRole = {
        ...broker,
        role: "broker",
        userType: "broker",
      };

      setUserData(userWithRole);
      setIsAdmin(false);
      setIsModerator(false);
      console.log("💼 User role: BROKER");
      return userWithRole;
    }

    // User not found in either table - treat as customer
    const customerData = {
      email: email,
      role: "customer",
      userType: "customer",
    };

    setUserData(customerData);
    setIsAdmin(false);
    setIsModerator(false);
    console.log("🛒 User role: CUSTOMER");
    return customerData;
  } catch (err) {
    console.error("Unexpected error fetching user data:", err);
    if (showToast) {
      toast.error("An unexpected error occurred. Please try again.");
    }
    return null;
  } finally {
    if (setLoading) setLoading(false);
  }
};

/**
 * Fetches broker data by email from the database (legacy function for backward compatibility)
 * @param {string} email - User's email address
 * @param {function} setUserData - State setter function
 * @param {function} setLoading - Optional loading state setter
 * @param {boolean} showToast - Whether to show error toast (default: true)
 * @returns {Promise<Object|null>} - User data object or null
 */
export const fetchBrokerData = async (
  email,
  setUserData,
  setLoading = null,
  showToast = true
) => {
  // Use the new unified function but ignore staff roles for backward compatibility
  return await fetchUserData(
    email,
    setUserData,
    () => {},
    () => {},
    setLoading,
    showToast
  );
};

/**
 * Initializes the app by checking user authentication and role
 * @param {function} setSession - State setter for session
 * @param {function} setUser - State setter for user
 * @param {function} setUserData - State setter for user data
 * @param {function} setIsAdmin - State setter for admin status
 * @param {function} setIsModerator - State setter for moderator status
 * @param {function} setAppLoading - State setter for app loading state
 * @returns {Promise<Object>} - Initialization result with user info
 */
export const initializeApp = async (
  setSession,
  setUser,
  setUserData,
  setIsAdmin,
  setIsModerator,
  setAppLoading
) => {
  setAppLoading(true);

  try {
    // Get current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Error getting session:", sessionError);
      setAppLoading(false);
      return { userData: null, role: "customer", userType: "customer" };
    }

    setSession(session);

    if (session?.user?.email) {
      setUser({
        id: session.user.id,
        email: session.user.email,
      });

      // Fetch user data and role
      const userData = await fetchUserData(
        session.user.email,
        setUserData,
        setIsAdmin,
        setIsModerator,
        null, // No loading state needed here
        false // Don't show toast during initialization
      );

      setAppLoading(false);
      return userData;
    } else {
      // No session - user is a customer
      const customerData = {
        email: null,
        role: "customer",
        userType: "customer",
      };

      setUserData(customerData);
      setIsAdmin(false);
      setIsModerator(false);
      setAppLoading(false);
      return customerData;
    }
  } catch (error) {
    console.error("Error initializing app:", error);
    setAppLoading(false);
    return { userData: null, role: "customer", userType: "customer" };
  }
};
