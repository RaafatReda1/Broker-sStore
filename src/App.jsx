import React, { useState, useEffect, useMemo } from "react";

import "./App.css";
import Header from "./Components/Header/Header";
import Products from "./Components/Products/Products";
import Profile from "./Components/Profile/Profile";
import Balance from "./Components/Balance/Balance";
import Cart from "./Components/Cart/Cart";
import ProductPage from "./Components/ProductPage/ProductPage";
import SignUp from "./Components/SignUp/SignUp";
import SignIn from "./Components/SignIn/SignIn";
import ProtectedRoute from "./Components/ProtectedRoute/ProtectedRoute";
import PageTransition from "./Components/PageTransition/PageTransition";
import AppLoading from "./Components/AppLoading/AppLoading";
import supabase from "./SupabaseClient.js";
import { Routes, Route, Link, data } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchUserData } from "./utils/userDataService";
import RequestReset from "./Components/SignIn/ResetPassword/RequestReset/RequestReset";
import DoReset from "./Components/SignIn/ResetPassword/DoReset/DoReset";

import {
  userContext,
  productsContext,
  cartContext,
  sessionContext,
  userDataContext,
  staffContext,
} from "./AppContexts";
import UserTypeRouter from "./Components/UserTypeRouter/UserTypeRouter.jsx";
import ManagingDashboard from "./Components/Manage/ManagingDashboard/ManagingDashboard.jsx";
import ViewNotifications from "./Components/ViewNotifications/ViewNotifications.jsx";
import WithDraw from "./Components/WithDraw/WithDraw.jsx";
import ScrollToTop from "./Components/ScrollToTop/ScrollToTop";
function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart") || "[]")
  );
  const [session, setSession] = useState(null);
  const [user, setUser] = useState({ id: "", email: "" });
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
  const [isModerator, setIsModerator] = useState(null);
  const [isAppInitialized, setIsAppInitialized] = useState(false);

  // Data loading states
  const [dataLoadingStates, setDataLoadingStates] = useState({
    products: false,
    session: false,
    userData: false,
  });

  // Check if all required data is loaded
  const isAllDataLoaded = useMemo(() => {
    const {
      products: productsLoaded,
      session: sessionLoaded,
      userData: userDataLoaded,
    } = dataLoadingStates;

    console.log("🔍 Data Loading Check:", {
      productsLoaded,
      sessionLoaded,
      userDataLoaded,
      hasSession: !!session,
      userDataValue: userData,
    });

    // Products are always required
    if (!productsLoaded) {
      console.log("❌ Products not loaded yet");
      return false;
    }

    // Session is always required
    if (!sessionLoaded) {
      console.log("❌ Session not loaded yet");
      return false;
    }

    // If there's a session, userData must be loaded
    if (session && !userDataLoaded) {
      console.log("❌ Session exists but userData not loaded yet");
      return false;
    }

    // If no session, userData should be null (which means loaded)
    if (!session && userData !== null) {
      console.log("❌ No session but userData is not null");
      return false;
    }

    console.log("✅ All data loaded successfully!");
    return true;
  }, [dataLoadingStates, session, userData]);

  // Check what component should be shown based on loaded data
  const getComponentToShow = () => {
    if (!isAllDataLoaded) {
      return "loading";
    }

    if (isAdmin) return "admin";
    if (isModerator) return "moderator";
    if (session) return "user";
    return "guest";
  };

  // Fetch the current session
  const getSession = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    } catch (err) {
      console.log(err);
    }
  };
  // Storing brokerId in localStorage if exists in URL
  const setbrokerId = (() => {
    const params = new URLSearchParams(window.location.search);
    const brokerId = params.get("brokerId");

    if (brokerId) {
      localStorage.setItem("brokerId", JSON.stringify(brokerId));
    }
  })();
  //detecting the auth state change (e.g., sign-in, sign-out)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, "Session:", !!session);

      // Only update session if it's actually different to prevent unnecessary re-renders
      setSession((prevSession) => {
        // Check if session actually changed
        if (
          prevSession?.user?.id === session?.user?.id &&
          prevSession?.access_token === session?.access_token
        ) {
          console.log("Session unchanged, skipping update");
          return prevSession;
        }

        console.log("Session changed, updating...");
        return session;
      });

      if (_event === "SIGNED_OUT") {
        console.log("User logged out → reloading...");
        window.location.reload(); // ✅ يعمل reload بس عند تسجيل الخروج
        window.location.href = "/";
      }
    });

    // 🧹 cleanup عشان متحصلش listeners زيادة
    return () => {
      subscription.unsubscribe();
    };
  }, []); // 👈 مفيش dependencies علشان يشتغل مرة واحدة بس

  // Initialize all app data
  const initializeApp = async () => {
    try {
      console.log("🚀 Starting app initialization...");

      // Reset all loading states
      setDataLoadingStates({
        products: false,
        session: false,
        userData: false,
      });

      // 1. Get session
      console.log("📡 Loading session...");
      await getSession();
      setDataLoadingStates((prev) => ({ ...prev, session: true }));
      console.log("✅ Session loaded");

      // 2. Fetch products data
      console.log("🛍️ Loading products...");
      const { data, error } = await supabase.from("Products").select("*");
      if (error) {
        console.error("Error fetching products:", error.message);
        toast.error("Failed to load products. Please refresh the page.");
      } else {
        setProducts(data);
        setDataLoadingStates((prev) => ({ ...prev, products: true }));
        console.log("✅ Products loaded:", data.length);
      }

      // 3. Wait a bit for smooth UX (optional)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("🎉 App initialization complete!");
      setIsAppInitialized(true);
    } catch (error) {
      console.error("❌ App initialization failed:", error);
      toast.error("Failed to initialize app. Please refresh the page.");
      setIsAppInitialized(true); // Still show app even if there's an error
    }
  };

  // Initialize app on mount
  useEffect(() => {
    initializeApp();
  }, []);
  // Redirecting to products page if user is authenticated and trying to access signIn or signUp page

  // Setting user data when session changes
  useEffect(() => {
    if (session) {
      setUser({
        id: session.user.id,
        email: session.user.email,
      });
    }
  }, [session]);
  // fetch User data from DB (Brokers or Staff)
  const getUserData = async () => {
    if (!session?.user?.email) {
      // No session, mark userData as loaded (null)
      setDataLoadingStates((prev) => ({ ...prev, userData: true }));
      return;
    }

    console.log("👤 Fetching user data for:", session.user.email);
    setDataLoadingStates((prev) => ({ ...prev, userData: false }));

    await fetchUserData(
      session.user.email,
      setUserData,
      setIsAdmin,
      setIsModerator
    );

    setDataLoadingStates((prev) => ({ ...prev, userData: true }));
    console.log("✅ User data loaded");
  };

  // Handle user data when session changes (only after app is initialized)
  useEffect(() => {
    if (isAppInitialized) {
      if (session) {
        console.log("🔄 App: Session detected, fetching user data...");
        getUserData();
      } else {
        console.log("🔄 App: No session, resetting user data...");
        // Reset user data when no session
        setUserData(null);
        setIsAdmin(false);
        setIsModerator(false);
        // Mark userData as loaded when there's no session
        setDataLoadingStates((prev) => ({ ...prev, userData: true }));
      }
    }
  }, [session, isAppInitialized]);

  // ✅ Sync cart changes to localStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ✅ Listen for localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "cart") {
        const newCart = JSON.parse(e.newValue || "[]");
        setCart(newCart);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // ✅ Prevent unnecessary re-initialization on tab focus/visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isAppInitialized) {
        console.log("Tab became visible, checking session validity...");
        // Only refresh session if needed, don't reinitialize everything
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.access_token !== session?.access_token) {
            console.log("Session token changed, updating...");
            setSession(session);
          } else {
            console.log("Session still valid, no update needed");
          }
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isAppInitialized]);
  const componentToShow = getComponentToShow();
  const allDataLoaded = isAllDataLoaded;

  console.log("App State:", {
    isAppInitialized,
    allDataLoaded,
    componentToShow,
    dataLoadingStates,
    userData,
    isAdmin,
    isModerator,
  });

  // Show loading screen until app is fully initialized
  if (!isAppInitialized) {
    return <AppLoading />;
  }

  // Show loading screen until all required data is loaded
  if (!allDataLoaded) {
    return <AppLoading />;
  }

  return (
    <productsContext.Provider value={{ products, setProducts }}>
      <cartContext.Provider value={{ cart, setCart }}>
        <sessionContext.Provider value={{ session, setSession }}>
          <userContext.Provider value={{ user, setUser }}>
            <userDataContext.Provider value={{ userData, setUserData }}>
              <staffContext.Provider
                value={{ isAdmin, setIsAdmin, isModerator, setIsModerator }}
              >
                <>
                  {componentToShow === "admin" ||
                  componentToShow === "moderator" ? (
                    <ManagingDashboard />
                  ) : (
                    <Header />
                  )}
                  <PageTransition>
                    <Route path="/*" element={<UserTypeRouter />} />{" "}
                    {/*This checks if the user Role inside UserTypeRouter.jsx first then renders the corresponding component if they're admin (<Admin />) or moderator (<Moderator />) or normal user (<Products />) */}
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute requireSession={true}>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/balance"
                      element={
                        <ProtectedRoute requireSession={true}>
                          <Balance />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/withdraw"
                      element={
                        <ProtectedRoute requireSession={true}>
                          <WithDraw />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute requireSession={true}>
                          <ViewNotifications />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cart"
                      element={
                        <ProtectedRoute blockBroker={true}>
                          <Cart />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/productPage/*" element={<ProductPage />} />
                    <Route path="/signup" element={<SignUp />} />
                    <Route path="/signin" element={<SignIn />} />
                    <Route path="/requestreset" element={<RequestReset />} />
                    <Route path="/doreset" element={<DoReset />} />
                  </PageTransition>
                </>

                <ToastContainer
                  position="top-right"
                  autoClose={2000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  pauseOnHover
                  draggable
                  theme="dark"
                />
                <ScrollToTop />
              </staffContext.Provider>
            </userDataContext.Provider>
          </userContext.Provider>
        </sessionContext.Provider>
      </cartContext.Provider>
    </productsContext.Provider>
  );
}

export default App;
