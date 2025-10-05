import React, { useState, useEffect } from "react";

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
import supabase from "./SupabaseClient.js";
import { Routes, Route, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchUserData } from "./utils/userDataService";

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
function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart") || "[]")
  );
  const [session, setSession] = useState(null);
  const [user, setUser] = useState({ id: "", email: "" });
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

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
      console.log("Auth state changed:", _event);

      setSession(session); // ✅ دايماً يحدث الـ session محليًا

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

  // Fetch products data with a random delay to simulate loading time
  useEffect(() => {
    getSession();

    const getData = async () => {
      const { data, error } = await supabase.from("Products").select("*");
      if (error) {
        console.error("Error fetching products:", error.message);
        toast.error("Failed to load products. Please refresh the page.");
      } else {
        setProducts(data);
      }
    };
    getData();
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
    setIsLoadingUserData(true);
    await fetchUserData(
      session?.user?.email,
      setUserData,
      setIsAdmin,
      setIsModerator
    );
    setIsLoadingUserData(false);
  };
  useEffect(() => {
    if (session) {
      getUserData();
    } else {
      // Reset user data when no session
      setUserData(null);
      setIsAdmin(false);
      setIsModerator(false);
      setIsLoadingUserData(false);
    }
  }, [session]);

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
                  {isAdmin || isModerator ? <ManagingDashboard /> : <Header />}
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
                  </PageTransition>
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
                </>
              </staffContext.Provider>
            </userDataContext.Provider>
          </userContext.Provider>
        </sessionContext.Provider>
      </cartContext.Provider>
    </productsContext.Provider>
  );
}

export default App;
