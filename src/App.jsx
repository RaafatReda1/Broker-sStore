/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import "./App.css";
import Header from "./Components/Header/Header";
import Products from "./Components/Products/Products";
import Profile from "./Components/Profile/Profile";
import Balance from "./Components/Balance/Balance";
import Cart from "./Components/Cart/Cart";
import ProductPage from "./Components/ProductPage/ProductPage";
import SignUp from "./Components/SignUp/SignUp";
import SignIn from "./Components/SignIn/SignIn";
import supabase from "./SupabaseClient.js";

import {
  currentPageContext,
  userContext,
  productsContext,
  cartContext,
  currentProductContext,
  sessionContext,
  userDataContext,
} from "./AppContexts";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart") || "[]")
  );
  const [currentPage, setcurrentPage] = useState("products");
  const [currentProduct, setCurrentProduct] = useState({});
  const [session, setSession] = useState(null);
  const [user, setUser] = useState({ id: "", email: "" });
  const [userData, setUserData] = useState(null);

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
      setSession(session); // ✅ هيبقى عندك نفس الشكل
      console.log("Auth state changed: ", _event, session);
    });

    return () => subscription.unsubscribe(); // عشان ما يحصلش memory leak
  }, []);
  // Fetch products data with a random delay to simulate loading time
  useEffect(() => {
    getSession();

    const getData = async () => {
      const RandomTime = Math.random() * 3000;

      setTimeout(async () => {
        try {
          let productsRes = await fetch("/products.json");
          let products = await productsRes.json();
          setProducts(products);
        } catch (err) {
          console.log(err);
        }
      }, RandomTime);
    };
    getData();
  }, []);
  // Redirecting to products page if user is authenticated and trying to access signIn or signUp page
  if (session && (currentPage === "signIn" || currentPage === "signUp")) {
    setcurrentPage("products");
  }
  // Setting user data when session changes
  useEffect(() => {
    if (session) {
      setUser({
        id: session.user.id,
        email: session.user.email,
      });
    }
  }, [session]);
  // fetch Broker's data from DB
  const getUserData = async () => {
    if (!session?.user?.email) return;

    const { data, error } = await supabase
      .from("Brokers")
      .select("*")
      .eq("email", session.user.email);

    if (error) {
      console.error("Fetching user data error:", error.message);
      return;
    }

    if (data && data.length > 0) {
      setUserData(data[0]);
      console.log("Fetched user data:", data[0]);
    } else {
      setUserData(null);
      console.log("No user data found for this email");
    }
  };
  useEffect(() => {
    if (session) {
      getUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <currentPageContext.Provider value={{ currentPage, setcurrentPage }}>
      <productsContext.Provider value={{ products, setProducts }}>
        <cartContext.Provider value={{ cart, setCart }}>
          <currentProductContext.Provider
            value={{ currentProduct, setCurrentProduct }}
          >
            <sessionContext.Provider value={{ session, setSession }}>
              <userContext.Provider value={{ user, setUser }}>
                <userDataContext.Provider value={{ userData, setUserData }}>
                  <>
                    <Header></Header>
                    {currentPage === "products" && <Products></Products>}
                    {currentPage === "profile" && <Profile></Profile>}
                    {currentPage === "balance" && <Balance></Balance>}
                    {currentPage === "cart" && <Cart></Cart>}
                    {currentPage === "productPage" && (
                      <ProductPage></ProductPage>
                    )}
                    {currentPage === "signUp" && <SignUp></SignUp>}
                    {currentPage === "signIn" && <SignIn></SignIn>}
                  </>
                </userDataContext.Provider>
              </userContext.Provider>
            </sessionContext.Provider>
          </currentProductContext.Provider>
        </cartContext.Provider>
      </productsContext.Provider>
    </currentPageContext.Provider>
  );
}

export default App;
