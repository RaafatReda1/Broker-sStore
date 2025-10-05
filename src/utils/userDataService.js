import supabase from "../SupabaseClient";
import { toast } from "react-toastify";

/**
 * Fetches broker data by email from the database
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
  if (!email) return null;

  if (setLoading) setLoading(true);

  try {
    const { data, error } = await supabase
      .from("Brokers")
      .select("*")
      .eq("email", email);

    if (error) {
      console.error("Fetching user data error:", error.message);
      if (showToast) {
        toast.error("Failed to load profile data. Please try again.");
      }
      return null;
    }

    if (data && data.length > 0) {
      const userData = data[0];
      setUserData(userData);
      return userData;
    } else {
      setUserData(null);
      console.log("No user data found for this email");
      return null;
    }
  } catch (err) {
    console.error("Unexpected error fetching broker data:", err);
    if (showToast) {
      toast.error("An unexpected error occurred. Please try again.");
    }
    return null;
  } finally {
    if (setLoading) setLoading(false);
  }
};
