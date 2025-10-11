import React, { useRef, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import "./DropMenu.css";
import { sessionContext } from "../../AppContexts";
import supabase from "../../SupabaseClient";
import { Link } from "react-router-dom";

// eslint-disable-next-line react/prop-types
const DropMenu = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
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
              {t("auth.signup.signUpButton")}
            </button>
          </Link>
          <Link to="/signin">
            <button className="dropdown-btn" onClick={onClose}>
              {t("auth.signin.signInButton")}
            </button>
          </Link>
        </>
      )}
      {session && (
        <>
          <Link to="/profile">
            <button className="dropdown-btn" onClick={onClose}>
              {t("navigation.profile")}
            </button>
          </Link>
          <button className="dropdown-btn logout-btn" onClick={handleLogOut}>
            {t("navigation.logout")}
          </button>
        </>
      )}
    </div>
  );
};

export default DropMenu;
