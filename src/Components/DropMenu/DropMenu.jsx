import React, { useRef, useEffect, useContext } from "react";
import "./DropMenu.css";
import { currentPageContext, sessionContext } from "../../App";
import supabase from "../../SupabaseClient";

const DropMenu = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);
  const { currentPage,setcurrentPage } = useContext(currentPageContext);
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

  const handleSignUp = () => {
    console.log("Sign Up clicked");
    setcurrentPage("signUp");

    onClose();
  };

  const handleSignIn = () => {
    console.log("Sign In clicked");
    setcurrentPage("signIn");
    onClose();
  };

  const handleProfile = () => {
    console.log("Profile clicked");
    setcurrentPage("profile");

    onClose();
  };

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
          <button className="dropdown-btn" onClick={handleSignUp}>
            Sign Up
          </button>
          <button className="dropdown-btn" onClick={handleSignIn}>
            Sign In
          </button>
        </>
      )}
      <button className="dropdown-btn" onClick={handleProfile}>
        Profile
      </button>
      <button className="dropdown-btn logout-btn" onClick={handleLogOut}>
        Log Out
      </button>
    </div>
  );
};

export default DropMenu;
