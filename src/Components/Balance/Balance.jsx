import { useState, useRef, useContext, createContext, useEffect } from "react";
import "./Balance.css";
import { currentPageContext, userContext } from "../../App";

const Balance = () => {
    const { currentPage, setcurrentPage } = useContext(currentPageContext);
    const { user, setUser } = useContext(userContext);
  return (
    <div className="popup-overlay">
      <div className="popup">
        <h2>Your Balances</h2>
        <p>
          <strong>Real Balance:</strong> $100
        </p>
        <p>
          <strong>Suspended Balance:</strong> $200
        </p>
        <button className="close-btn" onClick={()=> setcurrentPage('products')}>
          Close
        </button>
      </div>
    </div>
  );
};

export default Balance;
