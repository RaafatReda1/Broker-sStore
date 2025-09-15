import { useState, useRef, useContext, createContext, useEffect } from "react";
import "./Header.css";
import {
  currentPageContext,
  userContext,
  userSignedUpContext,
} from "../../App";
const Header = () => {
  const { currentPage, setcurrentPage } = useContext(currentPageContext);
  const { user, setUser } = useContext(userContext);
  const { userSignedUp, setUserSignedUp } = useContext(userSignedUpContext);

  return (
    <header>
      <div className="logo">
        <h2>
          <a href="/">Cicada</a>
        </h2>
      </div>

      <nav>
        {user.authority !== "broker" && (
          <h4 onClick={() => setcurrentPage("cart")}>Cart</h4>
        )}
        {user.authority === "broker" && (
          <h4 onClick={() => setcurrentPage("balance")}>Balance</h4>
        )}
        <h4 onClick={() => setcurrentPage("products")}>Products</h4>
        {!userSignedUp && currentPage != "signUp" && (
          <button onClick={() => setcurrentPage("signUp")}>SignUp</button>
        )}
        <div onClick={() => setcurrentPage("profile")}>
          {userSignedUp && <img src="/vite.svg" alt="Profile Photo" />}
        </div>
      </nav>
    </header>
  );
};

export default Header;
