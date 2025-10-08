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
 * @returns {Promise<Object|null>} - User data object or null
 */
export const fetchUserData = async (
  email,
  setUserData,
  setIsAdmin,
  setIsModerator,
  showToast = true
) => {
  if (!email) return null;


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
      setUserData(staff);

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

      return staff;
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
      setUserData(broker);
      setIsAdmin(false);
      setIsModerator(false);
      console.log("💼 User role: BROKER");
      return broker;
    }

    // User not found in either table
    setUserData(null);
    setIsAdmin(false);
    setIsModerator(false);
    console.log("❌ No user data found for this email");
    return null;
  } catch (err) {
    console.error("Unexpected error fetching user data:", err);
    if (showToast) {
      toast.error("An unexpected error occurred. Please try again.");
    }
    return null;
  } finally {
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
