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
export const isLoadingContext = createContext();
export const cartContext = createContext();
export const currentProductContext = createContext();
export const userSignedUpContext = createContext();
export const sessionContext = createContext();

function App() {
  const isFetched = useRef(false); // to control mounting times (prevent doubling the fetching code)
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSignedUp, setUserSignedUp] = useState(false);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart") || "[]")
  );
  const [currentPage, setcurrentPage] = useState("products");
  const [currentProduct, setCurrentProduct] = useState({});
  const [session, setSession] = useState(null);
  const [user, setUser] = useState({ id: "", email: "" });
  const [IsLoading, setIsLoading] = useState(true);
  const [serverResponded, setServerResponded] = useState(true);

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

          let usersRes = await fetch("/users.json");
          let users = await usersRes.json();

          let ordersRes = await fetch("/orders.json");
          let orders = await ordersRes.json();

          setProducts(products);
          setUsers(users);
          setOrders(orders);
          // for now we'll consider that we fetched user's data in case of the 1st user signed in and then we'll
          // modify the condition according to correct way so let's suppose that the first person signed in
        } catch (err) {
          console.log(err);
          setServerResponded(false);
        } finally {
          setIsLoading(false);
        }
      }, RandomTime);
    };
    if (!isFetched.current) {
      getData();
      isFetched.current = true;
    }
  }, [products]);
  if (session && (currentPage === "signIn" || currentPage === "signUp")) {
    setcurrentPage("products");
    console.log("redirecting to products page");
  }
  useEffect(() => {
    if (session) {
      setUser({
        id: session.user.id,
        email: session.user.email,
      });
        console.log(user);

    }
  }, [session]);

  return (
    <currentPageContext.Provider value={{ currentPage, setcurrentPage }}>
      <userContext.Provider value={{ user, setUser }}>
        <productsContext.Provider value={{ products, setProducts }}>
          <isLoadingContext.Provider value={IsLoading}>
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
          </isLoadingContext.Provider>
        </productsContext.Provider>
      </userContext.Provider>
    </currentPageContext.Provider>
  );
}

export default App;
