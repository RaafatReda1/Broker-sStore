import { useState, useRef, createContext, useEffect } from "react";
import "./App.css";
import Header from "./Components/Header/Header";
import Products from "./Components/Products/Products";
import Profile from "./Components/Profile/Profile";
import Balance from "./Components/Balance/Balance";
import Cart from "./Components/Cart/Cart";
import ProductPage from "./Components/ProductPage/ProductPage";
import PDF from "./Components/PDF/PDF";

export const currentPageContext = createContext();
export const userContext = createContext();
export const productsContext = createContext();
export const isLoadingContext = createContext();
export const cartContext = createContext();
export const currentProductContext = createContext();

function App() {
  const isFetched = useRef(false); // to control mounting times (prevent doubling the fetching code)
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState({});
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(
    JSON.parse(localStorage.getItem("cart") || "[]")
  );
  const [currentPage, setcurrentPage] = useState("products");
  const [currentProduct, setCurrentProduct] = useState({});
  const [IsLoading, setIsLoading] = useState(true);

  const [serverResponded, setServerResponded] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const brokerId = params.get("brokerId");

  if (brokerId) {
    localStorage.setItem("brokerId", JSON.stringify(brokerId));
  }
  useEffect(() => {
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
          setUser(users[1]);
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
  return (
    <currentPageContext.Provider value={{ currentPage, setcurrentPage }}>
      <userContext.Provider value={{ user, setUser }}>
        <productsContext.Provider value={{ products, setProducts }}>
          <isLoadingContext.Provider value={IsLoading}>
            <cartContext.Provider value={{ cart, setCart }}>
              <currentProductContext.Provider
                value={{ currentProduct, setCurrentProduct }}
              >
                <>
                  <Header></Header>
                  {currentPage === "products" && <Products></Products>}
                  {currentPage === "profile" && <Profile></Profile>}
                  {currentPage === "balance" && <Balance></Balance>}
                  {currentPage === "cart" && <Cart></Cart>}
                  {currentPage === "productPage" && <ProductPage></ProductPage>}
                </>
              </currentProductContext.Provider>
            </cartContext.Provider>
          </isLoadingContext.Provider>
        </productsContext.Provider>
      </userContext.Provider>
    </currentPageContext.Provider>
  );
}

export default App;
