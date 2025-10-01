import React, { useRef, useEffect, useContext } from "react";
import "./DropMenu.css";
import { sessionContext } from "../../AppContexts";
import supabase from "../../SupabaseClient";
import { Link } from "react-router-dom";

// eslint-disable-next-line react/prop-types
const DropMenu = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);
  const { session } = useContext(sessionContext);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLogOut = async () => {
    console.log("Log Out clicked");
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.log("LoggingOut Err:   " + err.message);
    }
    onClose();
  };


  if (!isOpen) return null;

  return (
    <div className="dropdown-menu" ref={dropdownRef}>
      {!session && (
        <>
          <Link to="/signup">
            <button className="dropdown-btn" onClick={onClose}>
              Sign Up
            </button>
          </Link>
          <Link to="/signin">
            <button className="dropdown-btn" onClick={onClose}>
              Sign In
            </button>
          </Link>
        </>
      )}
      {session && (
        <>
          <Link to="/profile">
            <button className="dropdown-btn" onClick={onClose}>
              Profile
            </button>
          </Link>
          <button className="dropdown-btn logout-btn" onClick={handleLogOut}>
            Log Out
          </button>
        </>
      )}
    </div>
  );
};

export default DropMenu;
