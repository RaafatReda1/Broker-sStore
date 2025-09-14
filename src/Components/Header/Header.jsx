import { useState, useRef, useContext, createContext, useEffect } from "react";
import "./Header.css";
import { currentPageContext, userContext } from "../../App";
const Header = () => {
  const { currentPage, setcurrentPage } = useContext(currentPageContext);
  const { user, setUser } = useContext(userContext);
  return (
    <header>
      <div className="logo">
        <h2>
          <a href="/">Cicada</a>
        </h2>
      </div>

      <nav>
        {user.authority !== "broker" && (<h4 onClick={() => setcurrentPage("cart")}>Cart</h4>)}
        {user.authority === "broker" && (
          <h4 onClick={() => setcurrentPage("balance")}>Balance</h4>
        )}
        <h4 onClick={() => setcurrentPage("products")}>Products</h4>
        <div onClick={() => setcurrentPage("profile")}>
          <img src="/vite.svg" alt="" />
        </div>
      </nav>
    </header>
  );
};

export default Header;
