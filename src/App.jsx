import { useState, useRef, createContext, useEffect } from "react";
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

export const currentPageContext = createContext();
export const userContext = createContext();
export const productsContext = createContext();
export const cartContext = createContext();
export const currentProductContext = createContext();
export const userSignedUpContext = createContext();
export const sessionContext = createContext();

function App() {
  const [products, setProducts] = useState([]);
  const [userSignedUp, setUserSignedUp] = useState(false);
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart") || "[]")
  );
  const [currentPage, setcurrentPage] = useState("products");
  const [currentProduct, setCurrentProduct] = useState({});
  const [session, setSession] = useState(null);
  const [user, setUser] = useState({ id: "", email: "" });

  const params = new URLSearchParams(window.location.search);
  const brokerId = params.get("brokerId");
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
  if (brokerId) {
    localStorage.setItem("brokerId", JSON.stringify(brokerId));
  }
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
  }, [products]);

  if (session && (currentPage === "signIn" || currentPage === "signUp")) {
    setcurrentPage("products");
  }

  useEffect(() => {
    if (session) {
      setUser({
        id: session.user.id,
        email: session.user.email,
      });
    }
  }, [session]);

  return (
    <currentPageContext.Provider value={{ currentPage, setcurrentPage }}>
        <productsContext.Provider value={{ products, setProducts }}>
            <cartContext.Provider value={{ cart, setCart }}>
              <currentProductContext.Provider
                value={{ currentProduct, setCurrentProduct }}
              >
                <userSignedUpContext.Provider
                  value={{ userSignedUp, setUserSignedUp }}
                >
                  <sessionContext.Provider value={{ session, setSession }}>
                    <userContext.Provider value={{ user, setUser }}>
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
                    </userContext.Provider>
                  </sessionContext.Provider>
                </userSignedUpContext.Provider>
              </currentProductContext.Provider>
            </cartContext.Provider>
        </productsContext.Provider>
    </currentPageContext.Provider>
  );
}

export default App;
